const API_URL = 'https://api.favorit-parts.ru/hs/hsprice/';
const INVALID_RESPONSE =
  'Сервис вернул некорректный ответ. Попробуйте ещё раз.';

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readText(value) {
  if (value == null) return null;
  if (typeof value !== 'string') throw new Error(INVALID_RESPONSE);
  return value.trim() ? value : null;
}

function readNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readArray(value) {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error(INVALID_RESPONSE);
  return value;
}

function apiErrorMessage(error) {
  const errors = Array.isArray(error) ? error : [error];
  const messages = errors.filter((item) => typeof item === 'string');
  if (messages.some((message) => message.includes('Request quota exceeded!'))) {
    return 'Лимит запросов исчерпан. Попробуйте позже.';
  }
  if (
    messages.some(
      (message) =>
        message.includes('Empty key!') ||
        message.includes('Invalid key client!'),
    )
  ) {
    return 'Сервис не принял ключ API. Проверьте настройки по инструкции в README.';
  }
  if (messages.some((message) => message.includes('Empty number goods!'))) {
    return 'Сервис не принял артикул. Проверьте введённое значение.';
  }
  return 'Сервис не смог выполнить поиск. Попробуйте ещё раз.';
}

async function requestGoods(parameters, signal) {
  if (signal?.aborted) throw new DOMException('Запрос отменён.', 'AbortError');
  const key = import.meta.env.VITE_FAVORIT_API_KEY?.trim();
  if (!key) {
    throw new Error(
      'Поиск не настроен. Добавьте ключ API по инструкции в README.',
    );
  }

  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 20_000);

  try {
    let response;
    try {
      response = await fetch(
        `${API_URL}?${new URLSearchParams({ key, ...parameters })}`,
        { signal: controller.signal },
      );
    } catch {
      if (signal?.aborted)
        throw new DOMException('Запрос отменён.', 'AbortError');
      if (timedOut)
        throw new Error('Сервис долго не отвечает. Попробуйте ещё раз.');
      throw new Error('Не удалось связаться с сервисом. Попробуйте ещё раз.');
    }

    if (!response.ok) {
      throw new Error('Сервис временно недоступен. Попробуйте ещё раз.');
    }
    let payload;
    try {
      payload = await response.json();
    } catch {
      if (signal?.aborted)
        throw new DOMException('Запрос отменён.', 'AbortError');
      if (timedOut)
        throw new Error('Сервис долго не отвечает. Попробуйте ещё раз.');
      throw new Error(INVALID_RESPONSE);
    }
    if (signal?.aborted)
      throw new DOMException('Запрос отменён.', 'AbortError');
    if (timedOut)
      throw new Error('Сервис долго не отвечает. Попробуйте ещё раз.');
    if (!isRecord(payload)) throw new Error(INVALID_RESPONSE);
    if (Object.hasOwn(payload, 'error')) {
      throw new Error(apiErrorMessage(payload.error));
    }
    if (!Array.isArray(payload.goods)) throw new Error(INVALID_RESPONSE);
    return payload.goods;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  }
}

function readGood(good) {
  if (!isRecord(good)) throw new Error(INVALID_RESPONSE);
  const number = readText(good.number);
  const name = readText(good.name);
  const brand = readText(good.brand);
  const warehouses = readArray(good.warehouses).filter((warehouse) => {
    if (!isRecord(warehouse)) throw new Error(INVALID_RESPONSE);
    return Object.keys(warehouse).length > 0;
  });
  const analogues = readArray(good.analogues);
  const empty = !number && !name && !brand && !warehouses.length;
  if (
    empty &&
    Object.keys(good).length > 0 &&
    !['goodsID', 'number', 'name', 'brand'].some((field) =>
      Object.hasOwn(good, field),
    )
  ) {
    throw new Error(INVALID_RESPONSE);
  }
  return { number, name, brand, warehouses, analogues, empty };
}

export async function searchBrands(number, { signal } = {}) {
  if (!number.trim()) return [];
  const goods = await requestGoods({ number: number.trim() }, signal);
  const brands = new Set();
  for (const good of goods) {
    const item = readGood(good);
    if (!item.empty && item.brand) brands.add(item.brand);
  }
  return [...brands];
}

export async function searchOffers({ number, brand }, { signal } = {}) {
  if (!number.trim() || !brand.trim()) return [];
  const goods = await requestGoods(
    { number: number.trim(), brand, analogues: 'on' },
    signal,
  );
  const offers = [];
  function addGood(good) {
    const item = readGood(good);
    if (!item.empty) {
      const warehouses = item.warehouses.length ? item.warehouses : [null];
      for (const warehouse of warehouses) {
        offers.push({
          id: String(offers.length),
          number: item.number,
          name: item.name,
          brand: item.brand,
          warehouse: warehouse
            ? readText(warehouse.code) || readText(warehouse.id)
            : null,
          price: readNumber(warehouse?.price),
          stock: readNumber(warehouse?.stock),
          hasWarehouse: warehouse !== null,
        });
      }
    }
    for (const analogue of item.analogues) addGood(analogue);
  }
  for (const good of goods) addGood(good);
  return offers;
}
