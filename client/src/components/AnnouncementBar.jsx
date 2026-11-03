import { Sparkles, Shield, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AnnouncementBar() {
  return (
    <div className="announcement-bar" role="region" aria-label="Store announcement">
      <div className="container announcement-bar__inner">
        <div className="announcement-bar__item announcement-bar__item--highlight">
          <Sparkles size={13} className="text-cyan animate-pulse" />
          <span>
            <strong>NEXORA Smart Electronics:</strong> Free Express Delivery on orders over Rs. 50,000
          </span>
        </div>
        <div className="announcement-bar__perks">
          <span className="announcement-perk">
            <Shield size={12} className="text-cyan" /> 2-Year Official Warranty
          </span>
          <span className="announcement-perk">
            <Truck size={12} className="text-cyan" /> 48-Hour Dispatch Guarantee
          </span>
          <Link to="/#catalog" className="announcement-link">
            Shop Catalog &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

