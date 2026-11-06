import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Database,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  TriangleAlert,
  Truck,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { Spinner } from '../components/Feedback.jsx';
import { formatCurrency } from '../utils/format.js';
import { hasUnavailableItems } from '../utils/cart.js';
import { calculateDeliveryFee } from '../utils/shipping.js';
import ProductImage from '../components/ProductImage.jsx';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, itemCount, subtotal, checkoutItems, clearCart } = useCart();
  const navigate = useNavigate();

  // Form states
  const [street, setStreet] = useState('Plot 42, Block 6, PECHS');
  const [city, setCity] = useState('Karachi');
  const [state, setState] = useState('Sindh');
  const [postalCode, setPostalCode] = useState('75400');
  const [phone, setPhone] = useState('+92 300 1234567');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [orderNotes, setOrderNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const unavailable = hasUnavailableItems(items);

  const deliveryFee = calculateDeliveryFee(subtotal);
  const grandTotal = Math.round((subtotal + deliveryFee) * 100) / 100;

  if (!items.length) {
    return (
      <div className="container section">
        <EmptyState
          icon={ShoppingBag}
          title="Your bag is empty"
          description="Add sneakers or athletic gear before proceeding to checkout."
          action={<Link to="/#catalog" className="button button--primary">Browse Catalog</Link>}
        />
      </div>
    );
  }

  const placeOrder = async (e) => {
    e.preventDefault();
    if (submitting || unavailable || !checkoutItems.length) return;

    if (!street.trim() || !city.trim()) {
      setError('Please provide a complete shipping address (street address and city are required).');
      return;
    }

    setSubmitting(true);
    setError(null);

    const formattedAddress = `${street.trim()}, ${city.trim()}, ${state.trim()} ${postalCode.trim()} (Phone: ${phone.trim()})${
      orderNotes.trim() ? ` [Notes: ${orderNotes.trim()}]` : ''
    } - Payment: ${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Demo Electronic Payment'}`;

    try {
      // The server ignores client prices and executes an atomic PostgreSQL transaction
      const data = await api.post('/checkout', {
        items: checkoutItems,
        shippingAddress: formattedAddress,
      });

      clearCart();
      navigate(`/order-confirmation/${data.order.id}`, {
        replace: true,
        state: { order: data.order },
      });
    } catch (checkoutError) {
      setError(checkoutError.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="container section checkout-page">
      <Link to="/cart" className="text-link checkout-back">
        <ArrowLeft size={16} />
        Back to shopping bag
      </Link>

      <div className="page-heading">
        <div>
          <span className="eyebrow eyebrow--cyan">ACID SECURE TRANSACTION</span>
          <h1>Finalize Order</h1>
          <p>Complete your shipping information and verify order details.</p>
        </div>
      </div>

      {error ? (
        <div className="notice notice--error" role="alert">
          <TriangleAlert size={19} />
          <div>
            <strong>We could not complete your checkout</strong>
            <p>{error}</p>
            <p>Your bag has been preserved so you can make adjustments and retry.</p>
          </div>
        </div>
      ) : null}

      {unavailable ? (
        <div className="notice notice--warning" role="alert">
          <TriangleAlert size={19} />
          <div>
            <strong>Unavailable item detected</strong>
            <p>Some items exceed available stock. Please adjust quantities in your bag before proceeding.</p>
          </div>
        </div>
      ) : null}

      <form onSubmit={placeOrder} className="checkout-layout">
        <div className="checkout-main">
          {/* Customer Summary */}
          <section className="panel">
            <div className="panel__header">
              <h2>1. Customer Account</h2>
            </div>
            <div className="customer-summary">
              <span className="avatar" aria-hidden="true">
                {user?.name?.split(/\s+/).slice(0, 2).map((part) => part[0]).join('')}
              </span>
              <div>
                <strong>{user?.name}</strong>
                <span>{user?.email}</span>
              </div>
            </div>
          </section>

          {/* Shipping Address */}
          <section className="panel">
            <div className="panel__header">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-cyan" />
                <h2>2. Shipping Destination</h2>
              </div>
            </div>

            <div className="form-grid">
              <div className="field-group span-2">
                <label htmlFor="street-input">Street Address *</label>
                <input
                  id="street-input"
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Street address, apartment, suite, unit"
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="city-input">City *</label>
                <input
                  id="city-input"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Karachi, Lahore, Islamabad"
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="state-input">Province / State</label>
                <input
                  id="state-input"
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Province or Region"
                />
              </div>

              <div className="field-group">
                <label htmlFor="postal-input">Postal Code</label>
                <input
                  id="postal-input"
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="Postal Code"
                />
              </div>

              <div className="field-group">
                <label htmlFor="phone-input">Contact Phone *</label>
                <input
                  id="phone-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 3XX XXXXXXX"
                  required
                />
              </div>

              <div className="field-group span-2">
                <label htmlFor="notes-input">Delivery Instructions (Optional)</label>
                <input
                  id="notes-input"
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Leave with security / Ring bell twice"
                />
              </div>
            </div>
          </section>

          {/* Payment Method Selector */}
          <section className="panel">
            <div className="panel__header">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-cyan" />
                <h2>3. Payment Method</h2>
              </div>
            </div>

            <div className="payment-options">
              <label className={`payment-option ${paymentMethod === 'cod' ? 'payment-option--active' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                />
                <div className="payment-option__body">
                  <div className="payment-option__title-row">
                    <Truck size={17} className="text-cyan" />
                    <strong>Cash on Delivery (Verified)</strong>
                    <span className="badge badge--success">RECOMMENDED</span>
                  </div>
                  <p className="payment-option__desc">
                    Pay securely in cash or via mobile wallet directly to the courier upon physical receipt and inspection.
                  </p>
                </div>
              </label>

              <label className={`payment-option ${paymentMethod === 'demo' ? 'payment-option--active' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="demo"
                  checked={paymentMethod === 'demo'}
                  onChange={() => setPaymentMethod('demo')}
                />
                <div className="payment-option__body">
                  <div className="payment-option__title-row">
                    <CreditCard size={17} className="text-blue" />
                    <strong>Demo Instant Card Payment (Simulated)</strong>
                    <span className="badge badge--neutral">ACADEMIC MODE</span>
                  </div>
                  <p className="payment-option__desc">
                    Simulate card validation for academic assessment. As mandated, no real payments are charged.
                  </p>
                </div>
              </label>
            </div>
          </section>

          {/* Order Item List Preview */}
          <section className="panel">
            <div className="panel__header">
              <h2>Items in this Order ({itemCount})</h2>
              <Link to="/cart" className="text-link">Edit Bag</Link>
            </div>
            <ul className="checkout-items">
              {items.map((item) => (
                <li key={item.productId} className="checkout-item-row">
                  <div className="checkout-item-thumb">
                    <ProductImage src={item.imageUrl} alt={item.name} />
                  </div>
                  <div className="checkout-item-info">
                    <strong>{item.name}</strong>
                    <span>{item.quantity} × {formatCurrency(item.price)}</span>
                  </div>
                  <strong className="checkout-item-total">{formatCurrency(item.price * item.quantity)}</strong>
                </li>
              ))}
            </ul>
          </section>

          <div className="notice notice--info">
            <Database size={19} />
            <div>
              <strong>ACID Database Row-Level Locking</strong>
              <p>
                Product inventory is locked via <code>SELECT FOR UPDATE</code> during checkout. PostgreSQL triggers maintain authoritative order totals and protect historical prices snapshot.
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <aside className="checkout-summary" aria-label="Order Financial Summary">
          <h2>Order Summary</h2>
          <dl className="summary-list">
            <div>
              <dt>Total Items</dt>
              <dd>{itemCount}</dd>
            </div>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatCurrency(subtotal)}</dd>
            </div>
            <div>
              <dt>Courier Delivery</dt>
              <dd>{deliveryFee === 0 ? <span className="text-success font-semibold">FREE</span> : formatCurrency(deliveryFee)}</dd>
            </div>
            <div className="summary-list__total">
              <dt>Total Due</dt>
              <dd>{formatCurrency(grandTotal)}</dd>
            </div>
          </dl>

          <button
            type="submit"
            className="button button--primary button--large button--full button--glow"
            disabled={submitting || unavailable}
          >
            {submitting ? (
              <Spinner size="sm" label="Committing PostgreSQL Transaction..." />
            ) : (
              <>
                <LockKeyhole size={17} />
                <span>Place Order &bull; {formatCurrency(grandTotal)}</span>
              </>
            )}
          </button>

          <div className="checkout-trust-badges">
            <div className="trust-item">
              <ShieldCheck size={14} className="text-cyan" />
              <span>256-Bit Encrypted Session</span>
            </div>
            <div className="trust-item">
              <CheckCircle2 size={14} className="text-cyan" />
              <span>Instant Database Confirmation</span>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
