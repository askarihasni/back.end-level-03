import { useState } from 'react';
import { Check, Disc3, Radio, ShoppingBag, Volume2, Zap } from 'lucide-react';
import { useCart } from '../../context/CartContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency } from '../../utils/format.js';

export default function DualShowcaseSection() {
  const [added, setAdded] = useState(false);
  const { addProduct } = useCart();
  const { showToast } = useToast();

  const stereoBundle = {
    id: 5, // Aurora Wireless Headphones / Dual Stereo Node Pair
    name: 'NEXORA Duo Soundstage Stereo Pair',
    category: 'Audio',
    currentPrice: 69999,
    stockQuantity: 10,
    imageUrl: '/images/dual-speakers.svg',
    description: 'Synchronized stereo pair delivering ultra-wide spatial separation, 42-hour playtime, and 60Hz-20kHz response.',
  };

  const handleAddBundle = () => {
    const result = addProduct(stereoBundle, 1, true);
    if (result.added > 0) {
      setAdded(true);
      showToast({
        title: 'Stereo Pair Added',
        message: `${stereoBundle.name} is now in your cart.`,
        type: 'success',
      });
      setTimeout(() => setAdded(false), 2000);
    }
  };

  return (
    <section className="nexora-dual-showcase" aria-label="Dual Stereo Showcase">
      {/* Giant "Amplified" Backdrop Typography (Reference Video 00:17-00:19) */}
      <div className="dual-showcase__watermark" aria-hidden="true">
        Amplified
      </div>

      <div className="container dual-showcase__container">
        <div className="dual-showcase__content">
          {/* Left Floating Spec Badge (Reference Video 00:18-00:19) */}
          <div className="spec-card spec-card--left">
            <div className="spec-card__thumb">
              <img src="/images/hero-speaker.svg" alt="" width={32} height={32} />
            </div>
            <div className="spec-card__info">
              <span className="spec-card__metric">42 Hrs</span>
              <p className="spec-card__caption">
                Up to 42 Hours of Continuous Playback on a Single Charge.
              </p>
            </div>
          </div>

          {/* Centerpiece Visual: Dual Angled Speakers */}
          <div className="dual-showcase__visual">
            <img
              src="/images/dual-speakers.svg"
              alt="NEXORA Stereo Pair"
              className="dual-showcase__img"
            />
            {/* Ambient Lime Neon Underglow */}
            <div className="dual-showcase__lime-aura" />
          </div>

          {/* Right Floating Spec Badge (Reference Video 00:18-00:20) */}
          <div className="spec-card spec-card--right">
            <div className="spec-card__header-row">
              <Radio size={16} className="text-lime" />
              <span className="spec-card__label">FREQUENCY RESPONSE</span>
            </div>
            <span className="spec-card__metric spec-card__metric--green">60Hz – 20kHz</span>
            <p className="spec-card__caption">
              Balanced custom acoustics deliver deep sub-bass and crystalline highs across any acoustic genre.
            </p>
          </div>
        </div>

        {/* Bottom Callout & Quick Add */}
        <div className="dual-showcase__footer">
          <div className="dual-showcase__badge">
            <Volume2 size={16} className="text-cyan" />
            <span>True Wireless Stereo (TWS) Automatic Link</span>
          </div>
          <button
            type="button"
            className="button button--pill button--primary button--glow"
            onClick={handleAddBundle}
          >
            {added ? (
              <>
                <Check size={16} />
                <span>Pair Added to Bag!</span>
              </>
            ) : (
              <>
                <ShoppingBag size={16} />
                <span>Order Duo Bundle — {formatCurrency(stereoBundle.currentPrice)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

