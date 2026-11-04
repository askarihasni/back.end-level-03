import { Search, X } from 'lucide-react';

const CATEGORIES = [
  { id: '', label: 'All' },
  { id: 'Running', label: 'Running' },
  { id: 'Basketball', label: 'Basketball' },
  { id: 'Training', label: 'Training' },
  { id: 'Skateboarding', label: 'Skateboarding' },
  { id: 'Lifestyle', label: 'Lifestyle' },
  { id: 'Accessories', label: 'Accessories' },
];

export default function CategorySearchRail({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  selectedCategory,
  onCategorySelect,
}) {
  return (
    <section className="search-category-rail" aria-label="Search and category navigation">
      <div className="container search-category-rail__inner">
        {/* Left: Dark Pill Search Input */}
        <form className="rail-search" role="search" onSubmit={onSearchSubmit}>
          <Search size={18} className="rail-search__icon" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by model, brand, or sport..."
            aria-label="Search models, brands, and sports"
          />
          {searchQuery && (
            <button
              type="button"
              className="rail-search__clear"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </form>

        {/* Right: Category Filter Pills (Active in Neon Lime) */}
        <div className="rail-categories" role="group" aria-label="Category filters">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id || 'all'}
                type="button"
                className={`rail-pill ${isActive ? 'rail-pill--active' : ''}`}
                onClick={() => onCategorySelect(cat.id)}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
