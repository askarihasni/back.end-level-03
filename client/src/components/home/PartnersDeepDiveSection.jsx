import { useState } from 'react';
import { Activity, BatteryCharging, Check, Cpu, ShieldCheck, Wifi } from 'lucide-react';

const FEATURES = [
  {
    id: 'audio',
    label: 'audio performance',
    title: 'Sound Performance',
    metric: '60Hz – 20kHz',
    desc: 'Balanced neodymium transducers deliver sub-bass rumble, uncompressed mids, and crystalline highs for every musical genre.',
    submetric: '108 dB SPL Peak Output',
    icon: Activity,
  },
  {
    id: 'battery',
    label: 'battery life',
    title: 'Battery Endurance',
    metric: '48 Hours+',
    desc: 'Powered by high-density silicon-anode cells with fast charge: gain 8 hours of playback from just a 15-minute quick boost.',
    submetric: 'USB-C PD 65W Fast Charging',
    icon: BatteryCharging,
  },
  {
    id: 'durability',
    label: 'durability',
    title: 'Precision Build & Durability',
    metric: 'IP67 Certified',
    desc: 'CNC-machined aerospace aluminium frame with waterproof acoustic fabric, resisting submersion, dust, and outdoor impacts.',
    submetric: '1.5m Drop Shockproof Tested',
    icon: ShieldCheck,
  },
  {
    id: 'connectivity',
    label: 'connectivity',
    title: 'Lossless Wireless Link',
    metric: '0.02s Latency',
    desc: 'Bluetooth 5.4 with LDAC & aptX Lossless support, plus Wi-Fi 6E multi-room synchronization across up to 32 audio nodes.',
    submetric: '24-bit / 192kHz Audiophile Streaming',
    icon: Wifi,
  },
];

export default function PartnersDeepDiveSection() {
  const [activeTab, setActiveTab] = useState('audio');

  const activeFeature = FEATURES.find((f) => f.id === activeTab) || FEATURES[0];
  const IconComponent = activeFeature.icon;

  return (
    <section className="nexora-deep-dive" aria-labelledby="partners-heading">
      <div className="container nexora-deep-dive__container">
        {/* Top Editorial Title (Reference Video 00:21) */}
        <div className="nexora-deep-dive__header">
          <span className="eyebrow eyebrow--cyan">HARDWARE ARCHITECTURE</span>
          <h2 id="partners-heading" className="nexora-deep-dive__title">
            Words From Our Partners
          </h2>
        </div>

        <div className="nexora-deep-dive__triptych">
          {/* Left Column: Interactive Vertical Feature Tabs */}
          <div className="nexora-deep-dive__tabs">
            <span className="features-label">our features</span>
            <div className="tabs-list" role="tablist">
              {FEATURES.map((feat) => {
                const isActive = feat.id === activeTab;
                return (
                  <button
                    key={feat.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`tab-item ${isActive ? 'tab-item--active' : ''}`}
                    onClick={() => setActiveTab(feat.id)}
                  >
                    <span className="tab-item__indicator" />
                    <span className="tab-item__text">{feat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center Column: 3D Monolith Tower Visual with Glowing Cyan LED Stripe */}
          <div className="nexora-deep-dive__visual-wrap">
            <img
              src="/images/sound-tower.svg"
              alt="NEXORA Sound Tower Monolith"
              className="nexora-deep-dive__visual"
            />
          </div>

          {/* Right Column: Dynamic Specs Card (Reference Video 00:23-00:24) */}
          <div className="nexora-deep-dive__card-wrap">
            <div className="deep-dive-card">
              <div className="deep-dive-card__header">
                <IconComponent size={20} className="text-cyan" />
                <h3 className="deep-dive-card__title">{activeFeature.title}</h3>
              </div>

              <div className="deep-dive-card__metric">
                {activeFeature.metric}
              </div>

              <p className="deep-dive-card__desc">
                {activeFeature.desc}
              </p>

              <div className="deep-dive-card__submetric-row">
                <Check size={14} className="text-cyan" />
                <span>{activeFeature.submetric}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

