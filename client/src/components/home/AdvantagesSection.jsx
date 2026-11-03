import { useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';

const ADVANTAGES = [
  {
    id: 1,
    metric: '38 hrs',
    title: 'Non-Stop Playback Time',
    desc: 'Tested across diverse acoustic conditions, keeping your rhythm alive day and night on a single ultra-dense charge.',
    tag: 'BATTERY ARCHITECTURE',
    glowColor: 'cyan',
    img: '/images/hero-speaker.svg',
  },
  {
    id: 2,
    metric: '1.8m',
    title: 'Spatial Audio Calibration',
    desc: 'Data points collected to dynamically optimize acoustic wavefronts and phase coherence in any room geometry.',
    tag: 'ACOUSTIC SENSING',
    glowColor: 'purple',
    img: '/images/hero-speaker.svg',
  },
  {
    id: 3,
    metric: '0.02s',
    title: 'Ultra-Low Latency Link',
    desc: 'Proprietary lossless wireless synchronization engine ensuring zero perceivable audio lag across connected devices.',
    tag: 'CONNECTIVITY',
    glowColor: 'blue',
    img: '/images/dual-speakers.svg',
  },
  {
    id: 4,
    metric: '100%',
    title: 'PostgreSQL ACID Integrity',
    desc: 'Zero-trust inventory engine ensuring stock reservations and purchase snapshots remain mathematically precise.',
    tag: 'DATABASE ARCHITECTURE',
    glowColor: 'emerald',
    img: '/images/sound-tower.svg',
  },
];

export default function AdvantagesSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? ADVANTAGES.length - 2 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= ADVANTAGES.length - 2 ? 0 : prev + 1));
  };

  return (
    <section className="nexora-advantages" id="advantages" aria-labelledby="advantages-heading">
      {/* Background Dot Matrix Pattern */}
      <div className="nexora-advantages__dots" aria-hidden="true" />

      <div className="container nexora-advantages__inner">
        {/* Left Column: Editorial Heading & Navigation Controls */}
        <div className="nexora-advantages__header">
          <span className="eyebrow eyebrow--cyan">NEXORA PROPRIETARY ADVANTAGE</span>
          <h2 id="advantages-heading" className="nexora-advantages__title">
            Advantages You Won&apos;t Find Elsewhere.
          </h2>

          <p className="nexora-advantages__text">
            We design and curate premium electronics that balances timeless aesthetics, durability, and everyday acoustic bliss. Your hardware delivers pure energy with every pulse.
          </p>

          {/* Interactive Arrow Slider Controls (from reference video 00:07-00:10) */}
          <div className="nexora-advantages__controls">
            <button
              type="button"
              className="slider-control-btn"
              onClick={handlePrev}
              aria-label="Previous advantage"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              type="button"
              className="slider-control-btn"
              onClick={handleNext}
              aria-label="Next advantage"
            >
              <ArrowRight size={18} />
            </button>
            <span className="slider-counter">
              0{currentIndex + 1} / 0{ADVANTAGES.length}
            </span>
          </div>
        </div>

        {/* Right Column: Dynamic Glowing Metric Cards */}
        <div className="nexora-advantages__cards-track">
          {ADVANTAGES.slice(currentIndex, currentIndex + 2).map((item) => (
            <div key={item.id} className={`advantage-card advantage-card--${item.glowColor}`}>
              <div className="advantage-card__top">
                <span className="advantage-card__tag">{item.tag}</span>
                <a href="#catalog" className="advantage-card__icon-link" aria-label={`Explore ${item.title}`}>
                  <ArrowUpRight size={18} />
                </a>
              </div>

              <div className="advantage-card__preview">
                <img src={item.img} alt="" className="advantage-card__img" />
                <div className="advantage-card__glow-aura" />
              </div>

              <div className="advantage-card__bottom">
                <div className="advantage-card__metric-row">
                  <span className="advantage-card__metric">{item.metric}</span>
                  <span className="advantage-card__title">{item.title}</span>
                </div>
                <p className="advantage-card__desc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

