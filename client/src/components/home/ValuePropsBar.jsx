import { Box, Headphones, Percent, ShieldCheck } from 'lucide-react';

export default function ValuePropsBar() {
  const perks = [
    {
      icon: Box,
      titleRu: 'Широкий выбор',
      descRu: 'топовых моделей',
      titleEn: 'Wide Selection',
      descEn: 'Top Flagship Models',
    },
    {
      icon: Percent,
      titleRu: 'Выгодные цены',
      descRu: 'и регулярные скидки',
      titleEn: 'Best Snapshot Prices',
      descEn: 'Daily Promotional Deals',
    },
    {
      icon: ShieldCheck,
      titleRu: 'Проверенные бренды',
      descRu: 'и новые коллекции',
      titleEn: 'Verified Brands',
      descEn: '100% Genuine Stock',
    },
    {
      icon: Headphones,
      titleRu: 'Поддержка клиентов',
      descRu: 'На связи 24/7',
      titleEn: 'Client Support',
      descEn: 'Priority 24/7 Service',
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
                  <strong className="value-prop-item__title">{perk.titleRu}</strong>
                  <span className="value-prop-item__desc">{perk.descRu}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
