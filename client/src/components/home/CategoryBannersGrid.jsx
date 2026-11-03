import { ArrowRight } from 'lucide-react';

export default function CategoryBannersGrid({ onSelectCategory }) {
  return (
    <section className="category-banners-section" aria-label="Featured category highlights">
      <div className="container">
        <div className="category-banners-grid">
          {/* Card 1: Electric Neon Lime Highlight Card */}
          <article className="banner-card banner-card--neon">
            <div className="banner-card__content">
              <span className="banner-card__eyebrow">POPULAR CATEGORY</span>
              <h3 className="banner-card__title">БАСКЕТБОЛ</h3>
              <p className="banner-card__subtitle">
                Контроль, лёгкость и уверенность на площадке. Pure acoustic power &amp; dynamic bass.
              </p>
              <button
                type="button"
                className="banner-card__cta"
                onClick={() => onSelectCategory('Audio')}
              >
                <span>Смотреть</span>
                <ArrowRight size={16} />
              </button>
            </div>
            <div className="banner-card__visual">
              <img
                src="https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=80"
                alt="Basketball & Sound"
                className="banner-card__img"
                loading="lazy"
              />
            </div>
          </article>

          {/* Card 2: Dark Runner / Computing Card */}
          <article className="banner-card banner-card--dark">
            <div className="banner-card__content">
              <span className="banner-card__eyebrow">PERFORMANCE GEAR</span>
              <h3 className="banner-card__title">БЕГ</h3>
              <p className="banner-card__subtitle">
                Лёгкость, скорость и максимум результата. High performance laptops &amp; computing nodes.
              </p>
              <button
                type="button"
                className="banner-card__cta"
                onClick={() => onSelectCategory('Electronics')}
              >
                <span>Смотреть</span>
                <ArrowRight size={16} />
              </button>
            </div>
            <div className="banner-card__visual">
              <img
                src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=600&q=80"
                alt="Running & Computing"
                className="banner-card__img"
                loading="lazy"
              />
            </div>
          </article>

          {/* Card 3: Dark Lifestyle / Gear Card with Neon Accents */}
          <article className="banner-card banner-card--dark">
            <div className="banner-card__content">
              <span className="banner-card__eyebrow">URBAN LIFESTYLE</span>
              <h3 className="banner-card__title">СТИЛЬ</h3>
              <p className="banner-card__subtitle">
                Комфорт и свобода в каждом шаге. Modern streetwear, watches &amp; wearable tech.
              </p>
              <button
                type="button"
                className="banner-card__cta"
                onClick={() => onSelectCategory('Fashion')}
              >
                <span>Смотреть</span>
                <ArrowRight size={16} />
              </button>
            </div>
            <div className="banner-card__visual">
              <img
                src="https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=600&q=80"
                alt="Style & Wearable Tech"
                className="banner-card__img"
                loading="lazy"
              />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
