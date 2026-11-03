import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Send, ShieldCheck, Sparkles } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Footer() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      showToast({
        title: 'Invalid Email',
        message: 'Please provide a valid email address to subscribe.',
        type: 'error',
      });
      return;
    }
    setSubscribed(true);
    showToast({
      title: 'Subscribed to NEXORA Insider',
      message: 'Thank you for joining our exclusive tech newsletter.',
      type: 'success',
    });
    setEmail('');
    setTimeout(() => setSubscribed(false), 4000);
  };

  return (
    <footer className="nexora-footer">
      {/* Background Dot Matrix Grid */}
      <div className="nexora-footer__dot-grid" aria-hidden="true" />

      <div className="container nexora-footer__content">
        {/* Top Newsletter Section (Matching Reference Video 00:25-00:28) */}
        <div className="nexora-footer__newsletter-block">
          <div className="newsletter-text">
            <span className="newsletter-eyebrow">
              <Sparkles size={13} className="text-cyan" />
              Stay Ahead of Innovation
            </span>
            <h3 className="newsletter-heading">Subscribe to get Our Newsletter</h3>
            <p className="newsletter-sub">
              Be the first to experience flagship hardware releases, engineering insights, and exclusive member privileges.
            </p>
          </div>

          <form className="newsletter-form" onSubmit={handleSubscribe}>
            <div className="newsletter-input-group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                aria-label="Enter your email for newsletter"
                required
              />
              <button
                type="submit"
                className="button button--pill button--newsletter"
                disabled={subscribed}
              >
                {subscribed ? (
                  <>
                    <Check size={16} />
                    <span>Subscribed</span>
                  </>
                ) : (
                  <>
                    <span>Subscribe</span>
                    <Send size={14} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Navigation Grid */}
        <div className="nexora-footer__grid">
          <div className="nexora-footer__brand-col">
            <Logo />
            <p className="nexora-footer__mission">
              Pioneering high-fidelity acoustic engineering, intelligent smart living, and high-performance electronics. Technology. Quality. Delivered.
            </p>
            <div className="nexora-footer__cert">
              <ShieldCheck size={16} className="text-cyan" />
              <span>ACID-Compliant PostgreSQL Transaction Engine</span>
            </div>
          </div>

          <div className="nexora-footer__col">
            <h4 className="footer-col-title">Shop</h4>
            <ul className="footer-links" role="list">
              <li><a href="/#catalog">All Products</a></li>
              <li><a href="/#showcase">Flagship Audio</a></li>
              <li><a href="/#catalog?category=Electronics">Computing &amp; Laptops</a></li>
              <li><a href="/#catalog?category=Accessories">Premium Accessories</a></li>
              <li><Link to="/?availability=in_stock">Ready to Dispatch</Link></li>
            </ul>
          </div>

          <div className="nexora-footer__col">
            <h4 className="footer-col-title">Support</h4>
            <ul className="footer-links" role="list">
              <li><a href="#services">Charging Stations &amp; Specs</a></li>
              <li><a href="#warranty">2-Year Official Warranty</a></li>
              <li><a href="#service">Technical Service Center</a></li>
              <li><Link to="/cart">Cart &amp; Order Status</Link></li>
              <li><a href="#contact">Contact Support</a></li>
            </ul>
          </div>

          <div className="nexora-footer__col">
            <h4 className="footer-col-title">Account</h4>
            <ul className="footer-links" role="list">
              {user ? (
                <>
                  {user.role === 'customer' && <li><Link to="/orders">My Order History</Link></li>}
                  {user.role === 'admin' && <li><Link to="/admin">Admin Management Portal</Link></li>}
                </>
              ) : (
                <>
                  <li><Link to="/login">Sign In</Link></li>
                  <li><Link to="/register">Create Account</Link></li>
                </>
              )}
              <li><Link to="/cart">Shopping Bag</Link></li>
              <li><a href="#help">Help &amp; Documentation</a></li>
            </ul>
          </div>
        </div>

        {/* Legal & Horizon Bottom Bar */}
        <div className="nexora-footer__bottom-row">
          <div className="nexora-footer__copyright">
            <span>&copy; {new Date().getFullYear()} NEXORA Technologies Inc. All rights reserved.</span>
            <div className="nexora-footer__legal-links">
              <a href="#terms">Terms &amp; Conditions</a>
              <span className="dot-sep">&bull;</span>
              <a href="#privacy">Privacy Policy</a>
              <span className="dot-sep">&bull;</span>
              <a href="#cookies">Cookie Preferences</a>
            </div>
          </div>

          <div className="nexora-footer__socials">
            <a href="https://tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok" className="social-pill">
              TikTok
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter / X" className="social-pill">
              X (Twitter)
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" className="social-pill">
              YouTube
            </a>
          </div>
        </div>
      </div>

      {/* Giant Typography Watermark Sinking into Horizon (Reference Video 00:27-00:28) */}
      <div className="nexora-footer__horizon" aria-hidden="true">
        <div className="horizon-glow" />
        <span className="horizon-watermark">NEXORA</span>
      </div>
    </footer>
  );
}
