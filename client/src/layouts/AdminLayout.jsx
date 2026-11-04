import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Boxes,
  ChartNoAxesCombined,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageSearch,
  ReceiptText,
  Store,
  Users,
  X,
} from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ReceiptText },
  { to: '/admin/products', label: 'Products', icon: PackageSearch },
  { to: '/admin/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
];

function pageTitle(pathname) {
  if (pathname === '/admin') return { title: 'Dashboard', subtitle: 'Business overview and recent activity' };
  if (pathname.startsWith('/admin/orders/')) return { title: 'Order details', subtitle: 'Review items and update fulfilment status' };
  if (pathname.startsWith('/admin/orders')) return { title: 'Orders', subtitle: 'Search, filter and fulfil customer orders' };
  if (pathname.startsWith('/admin/products')) return { title: 'Products', subtitle: 'Manage catalogue, pricing and stock' };
  if (pathname.startsWith('/admin/analytics')) return { title: 'Revenue analytics', subtitle: 'Monthly revenue, top customers and stock alerts' };
  return { title: 'Admin', subtitle: '' };
}

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { title, subtitle } = pageTitle(location.pathname);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="admin-shell">
      <a href="#admin-main" className="skip-link">Skip to admin content</a>
      <div
        className={`admin-overlay${sidebarOpen ? ' admin-overlay--visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside className={`admin-sidebar${sidebarOpen ? ' admin-sidebar--open' : ''}`} aria-label="Admin navigation">
        <div className="admin-sidebar__top">
          <Logo to="/admin" compact />
          <button
            type="button"
            className="icon-button admin-sidebar__close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close admin menu"
          >
            <X size={19} />
          </button>
        </div>

        <span className="admin-sidebar__eyebrow">Operations</span>
        <nav className="admin-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar__spacer" />
        <Link to="/" className="admin-store-link">
          <Store size={17} />
          View storefront
        </Link>
        <div className="admin-user">
          <span className="avatar" aria-hidden="true">{initials(user?.name)}</span>
          <div>
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
          </div>
          <button type="button" className="icon-button" onClick={handleLogout} aria-label="Sign out">
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <div className="admin-main-wrap">
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <button
              type="button"
              className="icon-button admin-menu-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open admin menu"
            >
              <Menu size={21} />
            </button>
            <div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          </div>
          <div className="admin-topbar__right">
            <Link to="/" className="button button--ghost button--small">
              <Store size={16} />
              Storefront
            </Link>
            <span className="avatar avatar--small" title={user?.name} aria-hidden="true">
              {initials(user?.name)}
            </span>
          </div>
        </header>

        <main id="admin-main" className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
