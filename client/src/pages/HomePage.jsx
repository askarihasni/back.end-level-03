import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  Cpu,
  Flame,
  Headphones,
  Laptop,
  Monitor,
  PackageCheck,
  Search,
  Smartphone,
  Sparkles,
  Watch,
  X,
  Zap,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useCategories, useProducts } from '../hooks/useProducts.js';
import ProductCard from '../components/ProductCard.jsx';
import Pagination from '../components/Pagination.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { ErrorPanel, ProductGridSkeleton } from '../components/Feedback.jsx';

// Video-inspired showcase sections
import HeroShowcase from '../components/home/HeroShowcase.jsx';
import AdvantagesSection from '../components/home/AdvantagesSection.jsx';
import BuyersSection from '../components/home/BuyersSection.jsx';
import DualShowcaseSection from '../components/home/DualShowcaseSection.jsx';
import PartnersDeepDiveSection from '../components/home/PartnersDeepDiveSection.jsx';
import PromotionalBanner from '../components/home/PromotionalBanner.jsx';
import BenefitsSection from '../components/home/BenefitsSection.jsx';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A to Z' },
];

const CATEGORY_RAIL = [
  { name: 'All Products', category: '', icon: Sparkles, count: 20 },
  { name: 'Electronics', category: 'Electronics', icon: Laptop, count: 4 },
  { name: 'Audio & Sound', category: 'Audio', icon: Headphones, count: 4 },
  { name: 'Accessories', category: 'Accessories', icon: Cpu, count: 4 },
  { name: 'Home & Living', category: 'Home & Living', icon: Zap, count: 3 },
  { name: 'Fashion & Wear', category: 'Fashion', icon: Watch, count: 3 },
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

  // Top trending / flash deals products fetched directly from database
  const [flashDeals, setFlashDeals] = useState([]);
  const [countdown, setCountdown] = useState({ hours: 8, minutes: 27, seconds: 43 });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    api
      .get('/products?sort=newest&limit=4')
      .then((data) => {
        if (active) setFlashDeals(data.products || []);
      })
      .catch(() => {
        if (active) setFlashDeals([]);
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
    event.preventDefault();
    updateParam('q', searchDraft.trim());
    const catalogElem = document.getElementById('catalog');
    if (catalogElem) catalogElem.scrollIntoView({ behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    setSearchDraft('');
  };

  return (
    <div className="home-experience">
      {/* 1. Cinematic Hero Section with Upward Rising Animation & Parallax (Reference Video) */}
      <HeroShowcase />

      {/* 2. Direct E-Commerce Category Rail (Instant Product Discovery) */}
      <section className="category-rail-section" aria-label="Browse by Category">
        <div className="container">
          <div className="category-rail">
            {CATEGORY_RAIL.map((cat) => {
              const Icon = cat.icon;
              const isActive = (cat.category === '' && !category) || category === cat.category;
              return (
                <button
                  key={cat.name}
                  type="button"
                  className={`category-rail__item ${isActive ? 'category-rail__item--active' : ''}`}
                  onClick={() => handleCategorySelect(cat.category)}
                >
                  <span className="category-rail__icon">
                    <Icon size={20} />
                  </span>
                  <span className="category-rail__name">{cat.name}</span>
                  <span className="category-rail__count">{cat.count}+ items</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Flash Deals of the Day / Featured Product Shelf (Immediate E-Commerce Products) */}
      {!hasFilters && flashDeals.length > 0 && (
        <section className="section section--flash-deals" aria-labelledby="flash-deals-heading">
          <div className="container">
            <div className="section-heading section-heading--deal">
              <div className="heading-left">
                <div className="inline-flex items-center flex-wrap gap-2">
                  <span className="badge badge--danger inline-flex items-center gap-1">
                    <Flame size={14} className="animate-bounce" />
                    <span>DEAL OF THE DAY</span>
                  </span>
                  <span className="flash-timer">
                    <Clock size={14} />
                    <span>
                      Ending in: {String(countdown.hours).padStart(2, '0')}:
                      {String(countdown.minutes).padStart(2, '0')}:
                      {String(countdown.seconds).padStart(2, '0')}
                    </span>
                  </span>
                </div>
                <h2 id="flash-deals-heading">Today&apos;s Featured Flagships</h2>
                <p>Limited quantity available at promotional snapshot prices. Refreshed daily.</p>
              </div>
              <div className="heading-right">
                <a href="#catalog" className="text-link text-link--bold">
                  <span>View All 20+ Products</span>
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>

            <div className="product-grid product-grid--featured">
              {flashDeals.map((product) => (
                <ProductCard product={product} key={product.id} priority />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Full Live Product Catalog Section Driven by PostgreSQL */}
      <section className="section section--catalog" id="catalog" aria-labelledby="catalog-heading">
        <div className="container">
          <div className="section-heading section-heading--catalog">
            <div>
              <span className="eyebrow eyebrow--cyan">LIVE DATABASE CATALOG</span>
              <h2 id="catalog-heading">Explore All NEXORA Electronics</h2>
              <p>
                {pagination
                  ? `${pagination.total} products synchronized with real PostgreSQL stock and pricing.`
                  : 'Browse our complete catalog.'}
              </p>
            </div>
          </div>

          {/* Interactive Search & Filter Toolbar */}
          <div className="catalog-toolbar">
            <form className="catalog-search" role="search" onSubmit={submitSearch}>
              <Search size={18} aria-hidden="true" className="catalog-search__icon" />
              <input
                type="search"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Search laptops, smartphones, audio, accessories..."
                aria-label="Search products"
              />
              {searchDraft ? (
                <button
                  type="button"
                  className="icon-button icon-button--small"
                  onClick={() => {
                    setSearchDraft('');
                    updateParam('q', '');
                  }}
                  aria-label="Clear search query"
                >
                  <X size={15} />
                </button>
              ) : null}
              <button type="submit" className="button button--primary button--small">
                Search
              </button>
            </form>

            <div className="catalog-filters">
              <label className="select-field">
                <span>Availability</span>
                <select
                  value={availability}
                  onChange={(event) => updateParam('availability', event.target.value)}
                >
                  <option value="all">All Inventory</option>
                  <option value="in_stock">In Stock Only</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </label>
              <label className="select-field">
                <span>Sort by</span>
                <select value={sort} onChange={(event) => updateParam('sort', event.target.value)}>
                  {SORT_OPTIONS.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="category-chips" role="group" aria-label="Filter by category">
            <button
              type="button"
              className={`chip${!category ? ' chip--active' : ''}`}
              onClick={() => updateParam('category', '')}
            >
              All Categories
            </button>
            {categories.map((item) => (
              <button
                type="button"
                key={item.name}
                className={`chip${category === item.name ? ' chip--active' : ''}`}
                onClick={() => updateParam('category', item.name)}
              >
                {item.name}
                <span>{item.productCount}</span>
              </button>
            ))}
          </div>

          {/* Active Filter Chips */}
          {hasFilters ? (
            <div className="active-filters">
              <span className="active-filters__label">Active Filters:</span>
              {q ? (
                <button type="button" onClick={() => updateParam('q', '')}>
                  &ldquo;{q}&rdquo; <X size={13} />
                </button>
              ) : null}
              {category ? (
                <button type="button" onClick={() => updateParam('category', '')}>
                  {category} <X size={13} />
                </button>
              ) : null}
              {availability !== 'all' ? (
                <button type="button" onClick={() => updateParam('availability', 'all')}>
                  {availability === 'in_stock' ? 'In Stock' : 'Out of Stock'} <X size={13} />
                </button>
              ) : null}
              <button type="button" className="active-filters__clear" onClick={clearFilters}>
                Reset All Filters
              </button>
            </div>
          ) : null}

          {error ? <ErrorPanel message={error} onRetry={reload} /> : null}

          {loading ? <ProductGridSkeleton /> : null}

          {!loading && !error && products.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No products found"
              description="No products matched your search or filter selections."
              action={
                <button type="button" className="button button--primary" onClick={clearFilters}>
                  Clear All Filters
                </button>
              }
            />
          ) : null}

          {!loading && !error && products.length > 0 ? (
            <div className="product-grid">
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

      {/* 5. Promotional Limited-Time Banner */}
      {!hasFilters && <PromotionalBanner />}

      {/* 6. Advantages You Won't Find Elsewhere (Reference Video 00:07-00:10) */}
      {!hasFilters && <AdvantagesSection />}

      {/* 7. Dual Speaker Showcase & Acoustic Engineering (Reference Video 00:16-00:20) */}
      {!hasFilters && <DualShowcaseSection />}

      {/* 8. Words From Our Partners / Tech Specs Tabs (Reference Video 00:21-00:24) */}
      {!hasFilters && <PartnersDeepDiveSection />}

      {/* 9. Buyers On Our Products / Customer Testimonials (Reference Video 00:11-00:15) */}
      {!hasFilters && <BuyersSection />}

      {/* 10. Customer Benefits & Guarantee Section */}
      {!hasFilters && <BenefitsSection />}
    </div>
  );
}
