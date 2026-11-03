import { Outlet } from 'react-router-dom';
import AnnouncementBar from '../components/AnnouncementBar.jsx';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import CartDrawer from '../components/CartDrawer.jsx';

export default function StoreLayout() {
  return (
    <div className="store-shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <AnnouncementBar />
      <Header />
      <main id="main-content" className="store-main">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
