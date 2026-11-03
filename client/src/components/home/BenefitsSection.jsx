import { Database, Headphones, RotateCcw, ShieldCheck, Truck, Zap } from 'lucide-react';

const BENEFITS = [
  {
    icon: Truck,
    title: 'Free Express Shipping',
    desc: 'Complimentary insured courier delivery across all orders above Rs. 50,000.',
  },
  {
    icon: ShieldCheck,
    title: '2-Year Official Warranty',
    desc: 'Full manufacturer hardware coverage with genuine part replacement.',
  },
  {
    icon: Database,
    title: 'ACID Transaction Engine',
    desc: 'Powered by PostgreSQL row locks. Zero overselling, guaranteed inventory snapshots.',
  },
  {
    icon: Headphones,
    title: '24/7 Expert Support',
    desc: 'Dedicated technical specialists available via chat, email, and direct helpline.',
  },
];

export default function BenefitsSection() {
  return (
    <section className="nexora-benefits" aria-labelledby="benefits-heading">
      <div className="container">
        <div className="section-heading text-center">
          <span className="eyebrow eyebrow--cyan">WHY CHOOSE NEXORA</span>
          <h2 id="benefits-heading">Engineering Excellence in Every Detail</h2>
          <p>Built for discerning listeners, creators, and technology professionals.</p>
        </div>

        <div className="benefits-grid">
          {BENEFITS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="benefit-card">
                <div className="benefit-card__icon-wrap">
                  <Icon size={24} className="text-cyan" />
                </div>
                <h3 className="benefit-card__title">{item.title}</h3>
                <p className="benefit-card__desc">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

