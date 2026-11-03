import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ShieldCheck, ShoppingBag, Sparkles, Star, Zap } from 'lucide-react';
import { useCart } from '../../context/CartContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency } from '../../utils/format.js';

const VARIANTS = [
  { id: 'obsidian', name: 'Midnight Obsidian', color: '#0B1728', ring: '#38BDF8', accent: 'cyan' },
  { id: 'electric', name: 'Electric Cobalt', color: '#10233F', ring: '#3478F6', accent: 'blue' },
  { id: 'emerald', name: 'Emerald Sound', color: '#0A1F18', ring: '#10B981', accent: 'lime' },
];

export default function HeroShowcase() {
  const [hasEntered, setHasEntered] = useState(false);
  const [hotspotActive, setHotspotActive] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(VARIANTS[0]);
  const [added, setAdded] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const stageRef = useRef(null);
  const { addProduct } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Flagship Hero Product linked to PostgreSQL ID 7
  const heroProduct = {
    id: 7,
    name: 'NEXORA EchoBeat Flagship Node',
    category: 'Audio',
    currentPrice: 12999,
    originalPrice: 16999,
    stockQuantity: 15,
    imageUrl: '/images/speaker-node.svg',
    description: '360° omnidirectional spatial acoustics with dynamic acoustic beamforming and high-excursion woofer.',
  };

  // Entrance animation trigger: speaker smoothly rises up from pedestal
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasEntered(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // User mouse parallax & interactive tilt
  const handleMouseMove = (e) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x: x * 20, y: y * -16 });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  const handleAddToCart = (e) => {
    e?.stopPropagation();
    const result = addProduct(heroProduct, 1, true);
    if (result.added > 0) {
      setAdded(true);
      showToast({
        title: 'Flagship Speaker Added',
        message: `${heroProduct.name} is now in your cart.`,
        type: 'success',
      });
      setTimeout(() => setAdded(false), 2200);
    }
  };

  const handleInstantBuy = (e) => {
    e?.stopPropagation();
    addProduct(heroProduct, 1, false);
    navigate('/checkout');
  };

  return (
    <section className="hero-nexora" aria-label="Hero Showcase">
      {/* Background Dot Matrix Grid (Reference Video) */}
      <div className="hero-nexora__dot-grid" aria-hidden="true" />

      {/* Subtle Ambient Radial Lighting responding to selected variant */}
      <div
        className={`hero-nexora__ambient-glow hero-nexora__ambient-glow--${selectedVariant.accent}`}
        aria-hidden="true"
      />

      {/* Editorial Headline Sunk in the Background: AMPLIFIED (Reference Video 00:03-00:05) */}
      <div
        className={`hero-nexora__watermark-wrap ${hasEntered ? 'hero-nexora__watermark-wrap--visible' : ''}`}
        aria-hidden="true"
      >
        <h2 className="hero-nexora__watermark">Amplified</h2>
      </div>

      <div className="container hero-nexora__container">
        {/* Top Header Text Content */}
        <div className={`hero-nexora__header ${hasEntered ? 'hero-nexora__header--entered' : ''}`}>
          <div className="hero-nexora__eyebrow">
            <Sparkles size={14} className="text-cyan animate-pulse" />
            <span>NEXORA 2026 FLAGSHIP ACOUSTIC SERIES</span>
          </div>

          <h1 className="hero-nexora__title">
            Discover Technology That Moves You.
          </h1>

          <p className="hero-nexora__subtitle">
            Explore premium electronics, exceptional acoustic fidelity, and a smarter shopping experience backed by real-time inventory.
          </p>

          <div className="hero-nexora__actions">
            <button
              type="button"
              className="button button--primary button--large button--glow"
              onClick={handleAddToCart}
            >
              <ShoppingBag size={18} />
              <span>Add to Cart &bull; {formatCurrency(heroProduct.currentPrice)}</span>
            </button>
            <button
              type="button"
              className="button button--secondary-light button--large"
              onClick={handleInstantBuy}
            >
              <Zap size={17} className="text-cyan" />
              <span>Buy Now (Instant Checkout)</span>
            </button>
          </div>
        </div>

        {/* Centerpiece 3D Visual with Interactive Upward Emergence & Mouse Tilt Parallax */}
        <div
          ref={stageRef}
          className="hero-nexora__stage"
          id="showcase"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Product Variant Color Selector Pill (Direct E-Commerce Touch) */}
          <div className="hero-variant-selector" role="group" aria-label="Speaker Color Variant">
            <span className="variant-label">Acoustic Finish:</span>
            <div className="variant-options">
              {VARIANTS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={`variant-dot ${selectedVariant.id === v.id ? 'variant-dot--active' : ''}`}
                  style={{ backgroundColor: v.color, borderColor: v.ring }}
                  onClick={() => setSelectedVariant(v)}
                  title={v.name}
                  aria-label={v.name}
                >
                  <span className="variant-dot__core" style={{ backgroundColor: v.ring }} />
                </button>
              ))}
            </div>
            <span className="variant-selected-name">{selectedVariant.name}</span>
          </div>

          {/* Interactive Tilt Container driven by user mouse position */}
          <div
            className="hero-nexora__tilt-stage"
            style={{
              transform: `perspective(1100px) rotateX(${mousePos.y}deg) rotateY(${mousePos.x}deg)`,
            }}
          >
            {/* The Rising Speaker Container (Entrance Animation & Floating Physics) */}
            <div
              className={`hero-nexora__speaker-floater ${
                hasEntered ? 'hero-nexora__speaker-floater--entered' : ''
              }`}
            >
              {/* Standalone Speaker Image */}
              <img
                src={heroProduct.imageUrl}
                alt="NEXORA EchoBeat Smart Acoustic Node"
                className="hero-nexora__product-img"
                loading="eager"
              />

              {/* Dynamic Specular Sheen Glare moving with mouse */}
              <div
                className="hero-nexora__specular-glare"
                style={{
                  transform: `translateX(${mousePos.x * 2.5}px) translateY(${mousePos.y * 1.5}px)`,
                }}
                aria-hidden="true"
              />

              {/* Pulsating Hotspot Marker (Reference Video 00:04-00:05) */}
              <div
                className={`hero-hotspot ${hotspotActive ? 'hero-hotspot--open' : ''}`}
                style={{ left: '55%', top: '56%' }}
              >
                <button
                  type="button"
                  className="hero-hotspot__pin"
                  onClick={() => setHotspotActive((prev) => !prev)}
                  aria-label="Toggle product specs callout"
                  title="Click to view product details"
                >
                  <span className="hero-hotspot__ring" />
                  <span className="hero-hotspot__core" style={{ backgroundColor: selectedVariant.ring }} />
                </button>

                {/* Connecting pointer line */}
                <div className="hero-hotspot__line" />

                {/* Floating Hotspot Card */}
                <div className="hero-hotspot__card">
                  <div className="hero-hotspot__thumb">
                    <img src={heroProduct.imageUrl} alt="" width={36} height={36} />
                  </div>
                  <div className="hero-hotspot__info">
                    <div className="hero-hotspot__price-row">
                      <span className="hero-hotspot__price">{formatCurrency(heroProduct.currentPrice)}</span>
                      <span className="hero-hotspot__badge">IN STOCK ({heroProduct.stockQuantity})</span>
                    </div>
                    <p className="hero-hotspot__desc">
                      Accompany you in your free time with pure spatial sound.
                    </p>
                    <button
                      type="button"
                      className="hero-hotspot__btn"
                      onClick={handleAddToCart}
                    >
                      {added ? (
                        <>
                          <Check size={12} />
                          <span>Added to Cart!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={12} />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Anchored Sculpted Terrain Pedestal at Base (Reference Video) */}
            <div className="hero-nexora__pedestal-anchor" aria-hidden="true">
              <img
                src="/images/pedestal-waves.svg"
                alt=""
                className="hero-nexora__pedestal-img"
              />
            </div>
          </div>

          {/* Floating Social Proof Pill (Reference Video 00:04-00:06) */}
          <div className="hero-nexora__social-pill">
            <div className="social-pill__avatars">
              <span className="avatar-circle avatar-circle--1" title="Dr. Tariq" />
              <span className="avatar-circle avatar-circle--2" title="Amna" />
              <span className="avatar-circle avatar-circle--3" title="Farhan" />
            </div>
            <div className="social-pill__data">
              <div className="social-pill__stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={13} fill="#F59E0B" color="#F59E0B" />
                ))}
              </div>
              <span className="social-pill__count">
                <strong>18,921</strong> (reviews)
              </span>
            </div>
          </div>

          {/* Stock Guarantee Banner */}
          <div className="hero-nexora__stock-pill">
            <ShieldCheck size={14} className="text-cyan" />
            <span>Live PostgreSQL Inventory Guaranteed &bull; Fast Dispatch</span>
          </div>
        </div>
      </div>
    </section>
  );
}
