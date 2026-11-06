import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShoppingBag, Trash2, X, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { formatCurrency } from '../utils/format.js';
import { calculateDeliveryFee, FREE_DELIVERY_THRESHOLD } from '../utils/shipping.js';
import QuantityStepper from './QuantityStepper.jsx';
import ProductImage from './ProductImage.jsx';

export default function CartDrawer() {
  const {
    items,
    itemCount,
    subtotal,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeProduct,
  } = useCart();
  const navigate = useNavigate();
  const drawerRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  const progress = Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100));
  const diffToFreeShipping = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const deliveryFee = calculateDeliveryFee(subtotal);
  const estimatedTotal = Math.round((subtotal + deliveryFee) * 100) / 100;

  const handleCheckoutClick = () => {
    closeDrawer();
    navigate('/checkout');
  };

  const handleViewCartClick = () => {
    closeDrawer();
    navigate('/cart');
  };

  return (
    <>
      <div
        className={`drawer-backdrop ${isDrawerOpen ? 'drawer-backdrop--active' : ''}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />
      <aside
        ref={drawerRef}
        className={`cart-drawer ${isDrawerOpen ? 'cart-drawer--open' : ''}`}
        aria-label="Shopping Cart Drawer"
        role="dialog"
        aria-modal="true"
      >
        <div className="cart-drawer__header">
          <div className="cart-drawer__title-wrap">
            <ShoppingBag size={20} className="text-blue" />
            <h2 className="cart-drawer__title">Your Cart</h2>
            <span className="cart-drawer__count-badge">{itemCount}</span>
          </div>
          <button
            type="button"
            className="icon-button icon-button--small"
            onClick={closeDrawer}
            aria-label="Close cart drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Free shipping progress bar */}
        <div className="cart-drawer__shipping-bar">
          <div className="shipping-bar__info">
            {diffToFreeShipping === 0 ? (
              <span className="shipping-bar__text shipping-bar__text--free">
                <CheckCircle2 size={14} className="text-success inline-icon" /> You qualified for <strong>FREE Express Shipping</strong>!
              </span>
            ) : (
              <span className="shipping-bar__text">
                Add <strong>{formatCurrency(diffToFreeShipping)}</strong> more for <strong>FREE Delivery</strong>
              </span>
            )}
            <span className="shipping-bar__percent">{progress}%</span>
          </div>
          <div className="shipping-bar__track">
            <div className="shipping-bar__fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Item list */}
        <div className="cart-drawer__body">
          {items.length === 0 ? (
            <div className="cart-drawer__empty">
              <div className="empty-icon-wrap">
                <ShoppingBag size={38} strokeWidth={1.5} />
              </div>
              <h3>Your cart is empty</h3>
              <p>Explore the latest sneakers and performance athletic gear.</p>
              <button
                type="button"
                className="button button--primary button--medium"
                onClick={closeDrawer}
              >
                Start Exploring
              </button>
            </div>
          ) : (
            <ul className="cart-drawer__items" role="list">
              {items.map((item) => (
                <li key={item.productId} className="cart-drawer__item">
                  <div className="cart-drawer__item-img">
                    <ProductImage src={item.imageUrl} alt={item.name} />
                  </div>
                  <div className="cart-drawer__item-details">
                    <div className="cart-drawer__item-head">
                      <Link
                        to={`/products/${item.productId}`}
                        onClick={closeDrawer}
                        className="cart-drawer__item-name"
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        className="cart-drawer__remove-btn"
                        onClick={() => removeProduct(item.productId)}
                        aria-label={`Remove ${item.name} from cart`}
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="cart-drawer__item-price">
                      {formatCurrency(item.price)}
                    </div>
                    <div className="cart-drawer__item-footer">
                      <QuantityStepper
                        value={item.quantity}
                        max={Math.max(1, item.stockQuantity)}
                        onChange={(qty) => updateQuantity(item.productId, qty)}
                        label={`Quantity for ${item.name}`}
                      />
                      <div className="cart-drawer__item-line-total">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer actions */}
        {items.length > 0 && (
          <div className="cart-drawer__footer">
            <div className="cart-drawer__summary-row">
              <span className="text-muted">Subtotal</span>
              <strong className="cart-drawer__subtotal">{formatCurrency(subtotal)}</strong>
            </div>
            <div className="cart-drawer__summary-row text-xs text-muted">
              <span>Delivery</span>
              <span>{deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}</span>
            </div>
            <div className="cart-drawer__summary-row">
              <span className="text-muted">Estimated total</span>
              <strong className="cart-drawer__subtotal">{formatCurrency(estimatedTotal)}</strong>
            </div>
            <div className="cart-drawer__cta-stack">
              <button
                type="button"
                className="button button--primary button--large button--block"
                onClick={handleCheckoutClick}
              >
                <span>Checkout Now</span>
                <ArrowRight size={17} />
              </button>
              <button
                type="button"
                className="button button--ghost button--small button--block"
                onClick={handleViewCartClick}
              >
                View Detailed Cart
              </button>
            </div>
            <div className="cart-drawer__assurance">
              <Zap size={13} className="text-blue" />
              <span>ACID-guaranteed checkout &amp; real-time stock protection</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

