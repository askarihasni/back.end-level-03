import { useEffect, useState } from 'react';
import { ArrowRight, Clock, Percent, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PromotionalBanner() {
  // Live countdown timer for promotional urgency
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 32, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDigit = (num) => String(num).padStart(2, '0');

  return (
    <section className="nexora-promo" aria-label="Limited Time Offer">
      <div className="container">
        <div className="promo-banner">
          <div className="promo-banner__glow" aria-hidden="true" />
          <div className="promo-banner__grid">
            <div className="promo-banner__content">
              <div className="promo-banner__badge">
                <Sparkles size={14} className="text-cyan animate-pulse" />
                <span>LIMITED TIME FLAGSHIP PROMO</span>
              </div>

              <h2 className="promo-banner__title">
                Upgrade Your Acoustic Setup. Save Up to 25% Today.
              </h2>

              <p className="promo-banner__desc">
                Bundle the EchoBeat Smart Node with any wireless headset or laptop accessory and receive exclusive complimentary express delivery plus an extended 3-year warranty.
              </p>

              {/* Countdown clock */}
              <div className="promo-countdown">
                <div className="countdown-label">
                  <Clock size={15} />
                  <span>Offer expires in:</span>
                </div>
                <div className="countdown-boxes">
                  <div className="countdown-box">
                    <span className="countdown-val">{formatDigit(timeLeft.hours)}</span>
                    <span className="countdown-unit">HRS</span>
                  </div>
                  <span className="countdown-colon">:</span>
                  <div className="countdown-box">
                    <span className="countdown-val">{formatDigit(timeLeft.minutes)}</span>
                    <span className="countdown-unit">MIN</span>
                  </div>
                  <span className="countdown-colon">:</span>
                  <div className="countdown-box">
                    <span className="countdown-val">{formatDigit(timeLeft.seconds)}</span>
                    <span className="countdown-unit">SEC</span>
                  </div>
                </div>
              </div>

              <div className="promo-banner__actions">
                <a href="#catalog" className="button button--primary button--large button--glow">
                  <span>Claim Promotion</span>
                  <ArrowRight size={17} />
                </a>
                <span className="promo-banner__guarantee">
                  <ShieldCheck size={16} className="text-cyan" />
                  <span>30-Day Money Back Guarantee</span>
                </span>
              </div>
            </div>

            <div className="promo-banner__visual">
              <img
                src="/images/hero-speaker.svg"
                alt="NEXORA Acoustic Promo"
                className="promo-banner__img"
              />
              <div className="promo-floating-tag">
                <Percent size={18} className="text-cyan" />
                <div>
                  <strong>SPECIAL BUNDLE</strong>
                  <span>Instant 25% Off</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

