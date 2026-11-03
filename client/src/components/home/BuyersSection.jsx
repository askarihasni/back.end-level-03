import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Quote, Sparkles } from 'lucide-react';

const TESTIMONIALS = [
  {
    id: 'softshift',
    partnerName: 'Softshift',
    partnerLogo: '✦ Softshift',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    quote:
      'Transformed our enterprise acoustic environments completely. Audio fidelity increased noticeably across our flagship listening rooms with NEXORA hardware.',
    author: 'Jaydon Siphron',
    role: 'CTO, SoundKeroig Acoustics',
    verified: true,
  },
  {
    id: 'lightbox',
    partnerName: 'Lightbox',
    partnerLogo: '❖ Lightbox',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    quote:
      'The seamless integration with our studio systems and exceptional build quality made the transition effortless. Best audio investment our team made this year.',
    author: 'Dulce Carder',
    role: 'CEO & Co-Founder, Merqale Studios',
    verified: true,
  },
  {
    id: 'spherule',
    partnerName: 'Spherule',
    partnerLogo: '◉ Spherule',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
    quote:
      'Real-time inventory precision and zero-latency audio streaming are second to none. Everything from ordering to delivery was meticulously executed.',
    author: 'Brandon Vetrov',
    role: 'Head of Sound Engineering, Keroig Labs',
    verified: true,
  },
];

export default function BuyersSection() {
  const [activeCardId, setActiveCardId] = useState('lightbox');

  const handlePrev = () => {
    const idx = TESTIMONIALS.findIndex((t) => t.id === activeCardId);
    const prevIdx = idx === 0 ? TESTIMONIALS.length - 1 : idx - 1;
    setActiveCardId(TESTIMONIALS[prevIdx].id);
  };

  const handleNext = () => {
    const idx = TESTIMONIALS.findIndex((t) => t.id === activeCardId);
    const nextIdx = idx === TESTIMONIALS.length - 1 ? 0 : idx + 1;
    setActiveCardId(TESTIMONIALS[nextIdx].id);
  };

  return (
    <section className="nexora-buyers" id="reviews" aria-labelledby="buyers-heading">
      <div className="container">
        <div className="nexora-buyers__header">
          <span className="eyebrow eyebrow--cyan">GLOBAL VALIDATION &amp; TESTIMONIALS</span>
          <h2 id="buyers-heading" className="nexora-buyers__title">
            Buyers On Our Products
          </h2>
          <p className="nexora-buyers__subtitle">
            Trusted by award-winning music producers, audio architects, and thousands of audiophiles worldwide.
          </p>
        </div>

        {/* Testimonial Cards Row (Reference Video 00:11-00:15) */}
        <div className="nexora-buyers__grid">
          {TESTIMONIALS.map((item) => {
            const isActive = item.id === activeCardId;
            return (
              <div
                key={item.id}
                className={`buyer-card ${isActive ? 'buyer-card--active' : ''}`}
                onClick={() => setActiveCardId(item.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setActiveCardId(item.id);
                }}
                aria-pressed={isActive}
              >
                <div className="buyer-card__partner-row">
                  <div className="buyer-card__avatar-wrap">
                    <img
                      src={item.avatar}
                      alt={item.author}
                      className="buyer-card__avatar"
                      loading="lazy"
                    />
                    {item.verified && (
                      <span className="buyer-card__badge" title="Verified Customer">
                        <CheckCircle2 size={13} />
                      </span>
                    )}
                  </div>
                  <span className="buyer-card__partner-tag">{item.partnerLogo}</span>
                </div>

                <div className="buyer-card__quote-wrap">
                  <Quote size={20} className="buyer-card__quote-icon" />
                  <p className="buyer-card__quote">&ldquo;{item.quote}&rdquo;</p>
                </div>

                <div className="buyer-card__footer">
                  <strong className="buyer-card__author">{item.author}</strong>
                  <span className="buyer-card__role">{item.role}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Center Bottom Navigation Buttons (Reference Video 00:12-00:15) */}
        <div className="nexora-buyers__nav">
          <button
            type="button"
            className="slider-control-btn"
            onClick={handlePrev}
            aria-label="Previous testimonial"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            type="button"
            className="slider-control-btn"
            onClick={handleNext}
            aria-label="Next testimonial"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

