import { Box, Headphones, Percent, ShieldCheck } from 'lucide-react';

export default function ValuePropsBar() {
  const perks = [
    {
      icon: Box,
      title: 'Wide Selection',
      desc: 'Top flagship models',
    },
    {
      icon: Percent,
      title: 'Competitive Prices',
      desc: 'Exclusive drops & deals',
    },
    {
      icon: ShieldCheck,
      title: 'Verified Brands',
      desc: '100% genuine stock',
    },
    {
      icon: Headphones,
      title: 'Customer Support',
      desc: 'Dedicated 24/7 care',
    },
  ];

  return (
    <section className="value-props-section" aria-label="Customer benefits and guarantees">
      <div className="container">
        <div className="value-props-bar">
          {perks.map((perk, idx) => {
            const Icon = perk.icon;
            return (
              <div key={idx} className="value-prop-item">
                <div className="value-prop-item__icon-wrap">
                  <Icon size={24} className="value-prop-item__icon" />
                </div>
                <div className="value-prop-item__text">
                  <strong className="value-prop-item__title">{perk.title}</strong>
                  <span className="value-prop-item__desc">{perk.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
