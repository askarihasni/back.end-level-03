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
            <h3 className="club-details__title">JOIN THE MOVEMENT</h3>
            <p className="club-details__subtitle">
              Push beyond limits. Earn cashback, unlock members-only drops, and receive exclusive rewards.
            </p>

            <div className="club-perks-row">
              <div className="club-perk">
                <Percent size={14} className="club-perk__icon" />
                <span>Cashback on Every Order</span>
              </div>
              <div className="club-perk">
                <Lock size={14} className="club-perk__icon" />
                <span>Secret Member Drops</span>
              </div>
              <div className="club-perk">
                <Timer size={14} className="club-perk__icon" />
                <span>Early Access to Releases</span>
              </div>
              <div className="club-perk">
                <Gift size={14} className="club-perk__icon" />
                <span>Gifts &amp; Birthday Rewards</span>
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
              <span>{joined ? 'Member Active!' : 'Join Nexora Club'}</span>
            </button>
            <span className="club-cta-subtext">Free Membership &bull; Instant Activation</span>
          </div>
        </div>
      </div>
    </section>
  );
}
