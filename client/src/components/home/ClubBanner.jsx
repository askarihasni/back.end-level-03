import { useState } from 'react';
import { Gift, Lock, Percent, Sparkles, Timer } from 'lucide-react';

export default function ClubBanner() {
  const [joined, setJoined] = useState(false);

  return (
    <section className="club-banner-section" aria-label="Nexora Club loyalty program">
      <div className="container">
        <div className="club-banner-card">
          {/* Left: Graphic VIP Card */}
          <div className="club-vip-card" aria-hidden="true">
            <div className="club-vip-card__header">
              <span className="club-vip-card__brand">NEXORA CLUB</span>
              <img src="/images/nexora-mark.svg" alt="" width={22} height={22} />
            </div>
            <div className="club-vip-card__chip" />
            <div className="club-vip-card__footer">
              <span className="club-vip-card__num">0007788</span>
              <span className="club-vip-card__tier">BLACK TIER</span>
            </div>
          </div>

          {/* Middle: Club Details & Perks */}
          <div className="club-details">
            <h3 className="club-details__title">СТАНЬ ЧАСТЬЮ ДВИЖЕНИЯ</h3>
            <p className="club-details__subtitle">
              Выходи за рамки, получай больше. Участвуй в эксклюзивных программах и бонусах.
            </p>

            <div className="club-perks-row">
              <div className="club-perk">
                <Percent size={14} className="club-perk__icon" />
                <span>Кэшбек с покупок</span>
              </div>
              <div className="club-perk">
                <Lock size={14} className="club-perk__icon" />
                <span>Доступ к закрытым предложениям</span>
              </div>
              <div className="club-perk">
                <Timer size={14} className="club-perk__icon" />
                <span>Ранний доступ к новинкам</span>
              </div>
              <div className="club-perk">
                <Gift size={14} className="club-perk__icon" />
                <span>Подарки и бонусы</span>
              </div>
            </div>
          </div>

          {/* Right: Solid Neon Lime CTA Button */}
          <div className="club-cta-col">
            <button
              type="button"
              className="club-cta-button"
              onClick={() => setJoined(true)}
            >
              <Sparkles size={16} />
              <span>{joined ? 'Вы в клубе! (Active)' : 'Присоединиться'}</span>
            </button>
            <span className="club-cta-subtext">Бесплатное участие &bull; Instant Activation</span>
          </div>
        </div>
      </div>
    </section>
  );
}
