import { Activity, PackageCheck, ShieldCheck } from 'lucide-react';

export default function AuthShell({ eyebrow, title, subtitle, children }) {
  return (
    <div className="container section auth-page">
      <div className="auth-shell">
        <aside className="auth-aside">
          <span className="eyebrow eyebrow--light">Nexa Market account</span>
          <h2>One account for a calmer shopping experience.</h2>
          <p>
            Sign in to check out securely, follow fulfilment progress and revisit every order you
            have placed.
          </p>
          <ul className="auth-aside__list">
            <li>
              <Activity size={18} />
              <div>
                <strong>Live stock and pricing</strong>
                <span>Product availability comes directly from PostgreSQL.</span>
              </div>
            </li>
            <li>
              <ShieldCheck size={18} />
              <div>
                <strong>Secure session</strong>
                <span>Passwords are hashed and sessions use HTTP-only cookies.</span>
              </div>
            </li>
            <li>
              <PackageCheck size={18} />
              <div>
                <strong>Order history</strong>
                <span>Every purchase is saved with its original purchase prices.</span>
              </div>
            </li>
          </ul>
          <p className="auth-aside__footnote">Demonstration storefront — no real payments are processed.</p>
        </aside>

        <section className="auth-card" aria-labelledby="auth-title">
          <span className="eyebrow">{eyebrow}</span>
          <h1 id="auth-title">{title}</h1>
          <p className="auth-card__subtitle">{subtitle}</p>
          {children}
        </section>
      </div>
    </div>
  );
}
