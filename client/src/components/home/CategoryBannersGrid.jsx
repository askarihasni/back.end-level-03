import { ArrowRight } from 'lucide-react';

export default function CategoryBannersGrid({ onSelectCategory }) {
  return (
    <section className="category-banners-section" aria-label="Featured category highlights">
      <div className="container">
        <div className="category-banners-grid">
          {/* Card 1: Dark Basketball Performance Card (Matching Image 2 Color Theme) */}
          <article className="banner-card banner-card--dark">
            <div className="banner-card__content">
              <div>
                <span className="banner-card__eyebrow">POPULAR CATEGORY</span>
                <h3 className="banner-card__title">BASKETBALL</h3>
                <p className="banner-card__subtitle">
                  Control, agility, and court dominance with explosive Zoom Air cushioning.
                </p>
              </div>
              <button
                type="button"
                className="banner-card__cta"
                onClick={() => onSelectCategory('Basketball')}
              >
                <span>Shop Now</span>
                <ArrowRight size={16} />
              </button>
            </div>
            <div className="banner-card__visual">
              <img
                src="/images/banners/banner-basketball.jpg"
                alt="Basketball Sneaker and Official Ball"
                className="banner-card__img"
                loading="lazy"
              />
            </div>
          </article>

          {/* Card 2: Dark Runner / Performance Card */}
          <article className="banner-card banner-card--dark">
            <div className="banner-card__content">
              <div>
                <span className="banner-card__eyebrow">PERFORMANCE GEAR</span>
                <h3 className="banner-card__title">RUNNING</h3>
                <p className="banner-card__subtitle">
                  Lightweight propulsion, endurance speed, and maximum energy return on every stride.
                </p>
              </div>
              <button
                type="button"
                className="banner-card__cta"
                onClick={() => onSelectCategory('Running')}
              >
                <span>Shop Now</span>
                <ArrowRight size={16} />
              </button>
            </div>
            <div className="banner-card__visual">
              <img
                src="/images/banners/banner-running.jpg"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=800&q=80';
                }}
                alt="Running Performance Legs"
                className="banner-card__img"
                loading="lazy"
              />
            </div>
          </article>

          {/* Card 3: Dark Lifestyle / Streetwear Card with Neon Accents */}
          <article className="banner-card banner-card--dark">
            <div className="banner-card__content">
              <div>
                <span className="banner-card__eyebrow">URBAN LIFESTYLE</span>
                <h3 className="banner-card__title">STREETWEAR</h3>
                <p className="banner-card__subtitle">
                  Everyday comfort, classic silhouettes, and retro streetwear aesthetics for life on the move.
                </p>
              </div>
              <button
                type="button"
                className="banner-card__cta"
                onClick={() => onSelectCategory('Streetwear')}
              >
                <span>Shop Now</span>
                <ArrowRight size={16} />
              </button>
            </div>
            <div className="banner-card__visual">
              <img
                src="/images/banners/banner-streetwear.jpg"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=800&q=80';
                }}
                alt="Streetwear Sneakers on Feet"
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
