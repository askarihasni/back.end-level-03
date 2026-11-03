import { Link } from 'react-router-dom';

export default function Logo({ to = '/', compact = false }) {
  return (
    <Link to={to} className={`logo${compact ? ' logo--compact' : ''}`} aria-label="NEXORA Smart Commerce home">
      <span className="logo__mark" aria-hidden="true">
        <img src="/images/nexora-mark.svg" alt="" width={24} height={24} />
      </span>
      <span className="logo__text">
        NEXORA<span className="logo__dot">.</span>
      </span>
      {!compact && <span className="logo__tagline">SMART COMMERCE</span>}
    </Link>
  );
}
