import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  articleChanged,
  brandSelected,
  fetchBrands,
  fetchOffers,
} from './searchSlice.js';
import BrandList from './BrandList.jsx';
import Loader from './Loader.jsx';
import OffersTable from './OffersTable.jsx';

export default function SearchPage() {
  const dispatch = useDispatch();
  const {
    number,
    brands,
    selectedBrand,
    brandsStatus,
    brandsError,
    offers,
    offersStatus,
    offersError,
  } = useSelector((state) => state.search);
  const brandsRequest = useRef(null);
  const offersRequest = useRef(null);
  const debounceTimer = useRef(null);
  const currentQuery = useRef({ number, brand: selectedBrand });

  useEffect(() => {
    if (number.trim()) {
      debounceTimer.current = setTimeout(() => {
        debounceTimer.current = null;
        if (currentQuery.current.number !== number) return;
        brandsRequest.current = dispatch(fetchBrands(number.trim()));
      }, 400);
    }

    return () => {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
      brandsRequest.current?.abort();
    };
  }, [dispatch, number]);

  useEffect(() => {
    if (
      number.trim() &&
      selectedBrand &&
      currentQuery.current.number === number &&
      currentQuery.current.brand === selectedBrand
    ) {
      offersRequest.current = dispatch(
        fetchOffers({ number: number.trim(), brand: selectedBrand }),
      );
    }

    return () => {
      offersRequest.current?.abort();
    };
  }, [dispatch, number, selectedBrand]);

  function handleArticleChange(event) {
    const nextNumber = event.target.value;
    currentQuery.current = { number: nextNumber, brand: null };
    dispatch(articleChanged(nextNumber));
    clearTimeout(debounceTimer.current);
    debounceTimer.current = null;
    brandsRequest.current?.abort();
    offersRequest.current?.abort();
  }

  function handleBrandSelect(brand) {
    if (
      currentQuery.current.number !== number ||
      currentQuery.current.brand === brand
    ) {
      return;
    }
    currentQuery.current = { number, brand };
    clearTimeout(debounceTimer.current);
    debounceTimer.current = null;
    brandsRequest.current?.abort();
    offersRequest.current?.abort();
    dispatch(brandSelected(brand));
  }

  function retryOffers() {
    if (
      offersStatus !== 'error' ||
      !selectedBrand ||
      currentQuery.current.number !== number ||
      currentQuery.current.brand !== selectedBrand
    ) {
      return;
    }
    offersRequest.current?.abort();
    offersRequest.current = dispatch(
      fetchOffers({ number: number.trim(), brand: selectedBrand }),
    );
  }

  function retryBrands() {
    if (brandsStatus !== 'error' || currentQuery.current.number !== number) {
      return;
    }
    clearTimeout(debounceTimer.current);
    debounceTimer.current = null;
    brandsRequest.current?.abort();
    if (number.trim()) {
      brandsRequest.current = dispatch(fetchBrands(number.trim()));
    }
  }

  return (
    <main className="container py-4 py-md-5">
      <header className="mb-4">
        <h1 className="mb-2">Поиск автозапчастей</h1>
        <p className="text-body-secondary mb-0">
          Введите артикул и выберите бренд детали.
        </p>
      </header>

      <section className="card shadow-sm mb-4" aria-labelledby="brands-heading">
        <div className="card-body p-3 p-md-4">
          <h2 id="brands-heading" className="h5 mb-3">
            1. Поиск производителя
          </h2>
          <label htmlFor="article" className="form-label">
            Артикул
          </label>
          <input
            id="article"
            className="form-control"
            type="text"
            value={number}
            onChange={handleArticleChange}
            aria-describedby="article-help"
            autoComplete="off"
            spellCheck={false}
          />
          <p id="article-help" className="form-text mb-4">
            Введите номер детали с упаковки или из каталога.
          </p>
          {brandsStatus === 'idle' && (
            <p className="text-body-secondary mb-0" role="status">
              {number.trim()
                ? 'Ожидаем завершения ввода артикула…'
                : 'Введите артикул, чтобы найти доступные бренды.'}
            </p>
          )}
          {brandsStatus === 'loading' && <Loader>Ищем бренды…</Loader>}
          {brandsStatus === 'error' && (
            <div className="alert alert-danger mb-0" role="alert">
              <p>{brandsError}</p>
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={retryBrands}
              >
                Повторить поиск брендов
              </button>
            </div>
          )}
          {brandsStatus === 'success' && brands.length === 0 && (
            <p className="text-body-secondary mb-0" role="status">
              Для этого артикула бренды не найдены. Проверьте артикул.
            </p>
          )}
          {brandsStatus === 'success' && brands.length > 0 && (
            <>
              <p className="text-body-secondary">
                Выберите бренд, чтобы найти предложения.
              </p>
              <BrandList
                brands={brands}
                selectedBrand={selectedBrand}
                onSelect={handleBrandSelect}
              />
            </>
          )}
        </div>
      </section>

      <section className="card shadow-sm" aria-labelledby="offers-heading">
        <div className="card-body p-3 p-md-4">
          <h2 id="offers-heading" className="h5 mb-3">
            2. Предложения и аналоги
          </h2>
          {selectedBrand && (
            <p className="text-body-secondary">
              Артикул: <span className="text-break">{number.trim()}</span>
              {' · '}Производитель:{' '}
              <span className="text-break">{selectedBrand}</span>
            </p>
          )}
          {offersStatus === 'idle' && (
            <p className="text-body-secondary mb-0" role="status">
              {selectedBrand
                ? 'Подготавливаем поиск предложений…'
                : 'Выберите производителя на первом этапе.'}
            </p>
          )}
          {offersStatus === 'loading' && (
            <Loader>Ищем предложения и аналоги…</Loader>
          )}
          {offersStatus === 'error' && (
            <div className="alert alert-danger mb-0" role="alert">
              <p>{offersError}</p>
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={retryOffers}
              >
                Повторить поиск предложений
              </button>
            </div>
          )}
          {offersStatus === 'success' && offers.length === 0 && (
            <p className="text-body-secondary mb-0" role="status">
              Предложения и аналоги не найдены.
            </p>
          )}
          {offersStatus === 'success' && offers.length > 0 && (
            <OffersTable offers={offers} />
          )}
        </div>
      </section>
    </main>
  );
}
