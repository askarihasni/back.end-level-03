import { Sparkles, ShieldCheck, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AnnouncementBar() {
  return (
    <div className="announcement-bar" role="region" aria-label="Store announcement">
      <div className="container announcement-bar__inner">
        <div className="announcement-bar__item announcement-bar__item--highlight">
          <Sparkles size={13} style={{ color: '#D2F800' }} />
          <span>
            <strong>KICKZONE SNEAKERS:</strong> Free Express Delivery on footwear & athletic gear over Rs. 10,000
          </span>
        </div>
        <div className="announcement-bar__perks">
          <span className="announcement-perk">
            <ShieldCheck size={12} style={{ color: '#D2F800' }} /> 100% Authentic Guaranteed
          </span>
          <span className="announcement-perk">
            <Truck size={12} style={{ color: '#D2F800' }} /> 48-Hour Dispatch
          </span>
          <Link to="/#catalog" className="announcement-link">
            Explore Collection &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

