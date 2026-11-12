const priceFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function OffersTable({ offers }) {
  return (
    <div
      className="table-responsive offers-table"
      role="region"
      aria-label="Предложения и аналоги по складам"
      tabIndex={0}
    >
      <table className="table table-hover align-middle mb-0">
        <caption className="visually-hidden">
          Найденные детали и аналоги: цена и остаток на каждом складе
        </caption>
        <thead>
          <tr>
            <th scope="col">Наименование</th>
            <th scope="col">Артикул</th>
            <th scope="col">Бренд</th>
            <th scope="col">Склад</th>
            <th scope="col" className="text-end">
              Цена
            </th>
            <th scope="col" className="text-end">
              Остаток
            </th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer) => (
            <tr key={offer.id}>
              <td>{offer.name ?? 'Не указано'}</td>
              <td>{offer.number ?? 'Не указано'}</td>
              <td>{offer.brand ?? 'Не указано'}</td>
              <td>
                {offer.hasWarehouse
                  ? (offer.warehouse ?? 'Склад не указан')
                  : 'Нет предложений по складам'}
              </td>
              <td className="text-end text-nowrap">
                {offer.price == null
                  ? 'Не указано'
                  : priceFormatter.format(offer.price)}
              </td>
              <td className="text-end text-nowrap">
                {offer.stock ?? 'Не указано'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
