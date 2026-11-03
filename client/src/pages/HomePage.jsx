import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { useCategories, useProducts } from '../hooks/useProducts.js';
import ProductCard from '../components/ProductCard.jsx';
import Pagination from '../components/Pagination.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { ErrorPanel, ProductGridSkeleton } from '../components/Feedback.jsx';

// Reference image matching components
import HeroShowcase from '../components/home/HeroShowcase.jsx';
import CategorySearchRail from '../components/home/CategorySearchRail.jsx';
import CategoryBannersGrid from '../components/home/CategoryBannersGrid.jsx';
import ValuePropsBar from '../components/home/ValuePropsBar.jsx';
import ClubBanner from '../components/home/ClubBanner.jsx';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A to Z' },
];

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories } = useCategories();

  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const availability = searchParams.get('availability') || 'all';
  const sort = searchParams.get('sort') || 'newest';
  const page = Math.max(1, Number.parseInt(searchParams.get('page'), 10) || 1);

  const [searchDraft, setSearchDraft] = useState(q);
  useEffect(() => {
    setSearchDraft(q);
  }, [q]);

  const filters = useMemo(
    () => ({ q, category, availability, sort, page, limit: 12 }),
    [q, category, availability, sort, page]
  );
  const { products, pagination, loading, error, reload } = useProducts(filters);

  // Top popular / trending shelf products fetched from database (5 items matching reference design)
  const [popularProducts, setPopularProducts] = useState([]);
  useEffect(() => {
    let active = true;
    api
      .get('/products?sort=newest&limit=5')
      .then((data) => {
        if (active) setPopularProducts(data.products || []);
      })
      .catch(() => {
        if (active) setPopularProducts([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const hasFilters = Boolean(q || category || availability !== 'all' || page > 1 || sort !== 'newest');

  const updateParam = (key, value, { resetPage = true } = {}) => {
    const next = new URLSearchParams(searchParams);
    if (value === '' || value === 'all' || value === undefined) next.delete(key);
    else next.set(key, value);
    if (resetPage && key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const handleCategorySelect = (cat) => {
    updateParam('category', cat);
    const catalogElem = document.getElementById('catalog');
    if (catalogElem) catalogElem.scrollIntoView({ behavior: 'smooth' });
  };

  const submitSearch = (event) => {
    event?.preventDefault();
    updateParam('q', searchDraft.trim());
    const catalogElem = document.getElementById('catalog');
    if (catalogElem) catalogElem.scrollIntoView({ behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    setSearchDraft('');
  };

  return (
    <div className="kickzone-theme">
      {/* 1. Hero Section (Left Bold Headline + Right Dynamic Product & 3 Floating Badges) */}
      <HeroShowcase />

      {/* 2. Search & Category Rail (Left Search Pill + Right Neon Filter Pills) */}
      <CategorySearchRail
        searchQuery={searchDraft}
        onSearchChange={setSearchDraft}
        onSearchSubmit={submitSearch}
        selectedCategory={category}
        onCategorySelect={handleCategorySelect}
      />

      {/* 3. Popular Shelf ("ПОПУЛЯРНОЕ / TRENDING NOW" - 5 Horizontal Product Cards) */}
      {!hasFilters && popularProducts.length > 0 && (
        <section className="section section--popular" aria-labelledby="popular-heading">
          <div className="container">
            <div className="popular-shelf-header">
              <h2 id="popular-heading" className="popular-shelf-title">
                ПОПУЛЯРНОЕ
              </h2>
              <a href="#catalog" className="popular-shelf-link">
                <span>Все товары</span>
              </a>
            </div>

            <div className="popular-grid">
              {popularProducts.map((product) => (
                <ProductCard product={product} key={product.id} priority />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Three Large Featured Category Banners (Neon Lime, Runner Dark, Lifestyle Dark) */}
      {!hasFilters && <CategoryBannersGrid onSelectCategory={handleCategorySelect} />}

      {/* 5. Four-Item Value Props Bar (Wide Selection, Snapshot Prices, Verified Brands, 24/7 Support) */}
      {!hasFilters && <ValuePropsBar />}

      {/* 6. Nexora VIP Club Banner (Black VIP Card Graphic, 4 Mini Perks, Neon Lime CTA Button) */}
      {!hasFilters && <ClubBanner />}

      {/* 7. Complete PostgreSQL Database Catalog Grid */}
      <section className="section section--catalog-dark" id="catalog" aria-labelledby="catalog-heading">
        <div className="container">
          <div className="catalog-header-dark">
            <div>
              <span className="eyebrow eyebrow--neon">LIVE DATABASE CATALOG</span>
              <h2 id="catalog-heading" className="catalog-title-dark">
                Каталог товаров
              </h2>
              <p className="catalog-subtitle-dark">
                {pagination
                  ? `${pagination.total} товаров в реальном времени из базы данных PostgreSQL.`
                  : 'Все товары магазина.'}
              </p>
            </div>

            <div className="catalog-filters-dark">
              <label className="select-field-dark">
                <span>Наличие:</span>
                <select
                  value={availability}
                  onChange={(e) => updateParam('availability', e.target.value)}
                >
                  <option value="all">Все</option>
                  <option value="in_stock">В наличии</option>
                  <option value="out_of_stock">Под заказ</option>
                </select>
              </label>

              <label className="select-field-dark">
                <span>Сортировка:</span>
                <select value={sort} onChange={(e) => updateParam('sort', e.target.value)}>
                  {SORT_OPTIONS.map((opt) => (
                    <option value={opt.value} key={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {error ? <ErrorPanel message={error} onRetry={reload} /> : null}

          {loading ? <ProductGridSkeleton /> : null}

          {!loading && !error && products.length === 0 ? (
            <EmptyState
              title="Товары не найдены"
              description="По вашему запросу ничего не найдено."
              action={
                <button type="button" className="btn-neon-lime" onClick={clearFilters}>
                  Сбросить фильтры
                </button>
              }
            />
          ) : null}

          {!loading && !error && products.length > 0 ? (
            <div className="catalog-grid-dark">
              {products.map((product) => (
                <ProductCard product={product} key={product.id} />
              ))}
            </div>
          ) : null}

          <Pagination
            pagination={pagination}
            onPageChange={(nextPage) => updateParam('page', String(nextPage), { resetPage: false })}
          />
        </div>
      </section>
    </div>
  );
}
