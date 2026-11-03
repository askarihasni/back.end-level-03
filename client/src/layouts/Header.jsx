import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function Header() {
  const { user, loading, logout } = useAuth();
  const { itemCount, toggleDrawer } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (location.pathname === '/') {
      const params = new URLSearchParams(location.search);
      setQuery(params.get('q') || '');
    }
  }, [location.pathname, location.search]);

  const submitSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    navigate(`/${params.toString() ? `?${params.toString()}` : ''}#catalog`);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Logo />

        <nav className="site-nav" aria-label="Main navigation">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Каталог
          </NavLink>
          <a href="/#catalog">Мужчинам</a>
          <a href="/#catalog">Женщинам</a>
          <a href="/#popular-heading">Новинки</a>
          <a href="/#catalog">Бренды</a>
          <a href="/#catalog">Акции</a>
          {user?.role === 'customer' ? <NavLink to="/orders">Заказы</NavLink> : null}
          {user?.role === 'admin' ? (
            <NavLink to="/admin" className="site-nav__admin">
              <LayoutDashboard size={15} />
              <span>Admin Portal</span>
            </NavLink>
          ) : null}
        </nav>

        <form className="header-search" role="search" onSubmit={submitSearch}>
          <Search size={16} aria-hidden="true" className="header-search__icon" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search audio, laptops, phones..."
            aria-label="Search products"
          />
          {query && (
            <button
              type="button"
              className="header-search__clear"
              onClick={() => setQuery('')}
              aria-label="Clear search query"
            >
              <X size={13} />
            </button>
          )}
        </form>

        <div className="header-actions">
          {!loading && user ? (
            <div className="header-user">
              <span className="avatar avatar--small" aria-hidden="true">
                {initials(user.name)}
              </span>
              <span className="header-user__name">{user.name.split(' ')[0]}</span>
              <button
                type="button"
                className="icon-button icon-button--small"
                onClick={handleLogout}
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : !loading ? (
            <div className="header-auth">
              <Link to="/login" className="button button--ghost button--small">
                Войти
              </Link>
              <Link to="/register" className="button button--primary button--small header-auth__register">
                Регистрация
              </Link>
            </div>
          ) : null}

          {/* Cart Drawer Trigger Button (Neon Lime Pill from Reference Design) */}
          <button
            type="button"
            className="cart-button"
            onClick={toggleDrawer}
            aria-label={`Shopping cart with ${itemCount} items`}
          >
            <div className="cart-button__icon-wrap">
              <ShoppingBag size={17} />
            </div>
            <span className="cart-button__label">Корзина {itemCount}</span>
          </button>

          <button
            type="button"
            className="icon-button mobile-menu-button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      <div id="mobile-navigation" className={`mobile-nav${mobileOpen ? ' mobile-nav--open' : ''}`}>
        <div className="container mobile-nav__inner">
          <form className="header-search header-search--mobile" role="search" onSubmit={submitSearch}>
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
            />
          </form>

          <nav className="mobile-nav__links" aria-label="Mobile navigation">
            <NavLink to="/" end>
              Shop All Products
            </NavLink>
            <a href="/#showcase">Product Showcase</a>
            <a href="/#advantages">Acoustic Engineering</a>
            <a href="/#catalog">Full Catalog</a>
            {user?.role === 'customer' ? <NavLink to="/orders">My Orders</NavLink> : null}
            {user?.role === 'admin' ? <NavLink to="/admin">Admin Dashboard</NavLink> : null}
            <button
              type="button"
              className="mobile-cart-link"
              onClick={() => {
                setMobileOpen(false);
                toggleDrawer();
              }}
            >
              <ShoppingBag size={18} />
              <span>Shopping Cart ({itemCount})</span>
            </button>
          </nav>

          <div className="mobile-nav__account">
            {user ? (
              <div className="mobile-account">
                <span className="avatar" aria-hidden="true">{initials(user.name)}</span>
                <div>
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
                <button type="button" className="button button--secondary button--small" onClick={handleLogout}>
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="mobile-auth">
                <Link to="/login" className="button button--secondary">
                  <UserRound size={16} />
                  Sign in
                </Link>
                <Link to="/register" className="button button--primary">
                  Create account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
