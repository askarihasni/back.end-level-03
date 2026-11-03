import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Award, Box, RotateCcw, ShieldCheck, ShoppingBag, Sparkles, Truck } from 'lucide-react';
import { useCart } from '../../context/CartContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency } from '../../utils/format.js';

export default function HeroShowcase() {
  const [hasEntered, setHasEntered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const stageRef = useRef(null);
  const { addProduct } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Flagship Hero Product linked to PostgreSQL ID 7
  const heroProduct = {
    id: 7,
    name: 'NEXORA Aeroflow Flagship Sneaker & Node',
    category: 'Audio',
    currentPrice: 12400,
    originalPrice: 16999,
    stockQuantity: 15,
    imageUrl: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1000&q=80',
    description: 'Dynamic cushion propulsion, breathable engineered upper, and high-impact energy return.',
  };

  // Entrance animation trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasEntered(true);
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  // 3D Parallax & Tilt Tracking User Cursor
  const handleMouseMove = (e) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x: x * 18, y: y * -14 });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  const handleAddToCart = (e) => {
    e?.stopPropagation();
    const result = addProduct(heroProduct, 1, true);
    if (result.added > 0) {
      showToast({
        title: 'Added to Cart',
        message: `${heroProduct.name} is now in your cart.`,
        type: 'success',
      });
    }
  };

  return (
    <section className="hero-kickzone" aria-label="Hero Showcase">
      <div className="container hero-kickzone__container">
        <div className="hero-kickzone__grid">
          {/* Left Column: Bold Typography & Action Buttons */}
          <div className="hero-kickzone__content">
            <span className="hero-kickzone__eyebrow">НОВАЯ КОЛЛЕКЦИЯ</span>

            <h1 className="hero-kickzone__title">
              ДВИЖЕНИЕ<br />
              НАЧИНАЕТСЯ<br />
              <span className="text-neon-lime">С ТЕБЯ</span>
            </h1>

            <p className="hero-kickzone__subtitle">
              Выбирай кроссовки и электронику, которые подходят твоему стилю и ритму жизни.
            </p>

            <div className="hero-kickzone__actions">
              <a href="#catalog" className="btn-neon-lime">
                <span>Смотреть каталог</span>
              </a>
              <a href="#catalog" className="btn-dark-ghost">
                <span>Новинки</span>
              </a>
            </div>
          </div>

          {/* Right Column: Dynamic Floating Product + 3 Stacked Glass Badges */}
          <div
            ref={stageRef}
            className="hero-kickzone__stage"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* The Dynamic Floating Product with Upward Entrance & 3D Tilt */}
            <div
              className={`hero-kickzone__product-wrap ${
                hasEntered ? 'hero-kickzone__product-wrap--entered' : ''
              }`}
              style={{
                transform: `perspective(1000px) rotateX(${mousePos.y}deg) rotateY(${mousePos.x}deg)`,
              }}
            >
              <img
                src={heroProduct.imageUrl}
                alt="NEXORA Flagship Sport & Acoustic Gear"
                className="hero-kickzone__product-img"
                loading="eager"
              />
              <div className="hero-kickzone__shadow" />
            </div>

            {/* 3 Floating Glass Reassurance Badges Stacked on Right */}
            <div className="hero-floating-badges" aria-label="Customer assurances">
              <div className="floating-badge">
                <div className="floating-badge__icon">
                  <Truck size={20} />
                </div>
                <div className="floating-badge__text">
                  <strong>Бесплатная доставка</strong>
                  <span>от 50 000 Rs</span>
                </div>
              </div>

              <div className="floating-badge">
                <div className="floating-badge__icon">
                  <RotateCcw size={20} />
                </div>
                <div className="floating-badge__text">
                  <strong>Примерка перед оплатой</strong>
                  <span>14 дней на возврат</span>
                </div>
              </div>

              <div className="floating-badge">
                <div className="floating-badge__icon">
                  <Award size={20} />
                </div>
                <div className="floating-badge__text">
                  <strong>100% оригинал</strong>
                  <span>Гарантия подлинности</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
