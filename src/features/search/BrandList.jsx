export default function BrandList({ brands, selectedBrand, onSelect }) {
  return (
    <ul
      className="list-unstyled d-flex flex-wrap gap-2 mb-0"
      aria-label="Бренды"
    >
      {brands.map((brand) => (
        <li key={brand}>
          <button
            type="button"
            className={`btn ${selectedBrand === brand ? 'btn-primary' : 'btn-outline-primary'}`}
            aria-pressed={selectedBrand === brand}
            onClick={() => onSelect(brand)}
          >
            {brand}
          </button>
        </li>
      ))}
    </ul>
  );
}
