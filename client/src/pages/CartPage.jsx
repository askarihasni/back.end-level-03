import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShoppingBag, Trash2, TriangleAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ProductImage from '../components/ProductImage.jsx';
import QuantityStepper from '../components/QuantityStepper.jsx';
import { formatCurrency, stockLabel } from '../utils/format.js';
import { hasUnavailableItems } from '../utils/cart.js';
import { calculateDeliveryFee, FREE_DELIVERY_THRESHOLD } from '../utils/shipping.js';

export default function CartPage() {
  const { user } = useAuth();
  const { items, itemCount, lineCount, subtotal, updateQuantity, removeProduct, clearCart } = useCart();
  const toast = useToast();
  const unavailable = hasUnavailableItems(items);
  const deliveryFee = calculateDeliveryFee(subtotal);
  const estimatedTotal = Math.round((subtotal + deliveryFee) * 100) / 100;

  const handleRemove = (item) => {
    removeProduct(item.productId);
    toast.info('Removed from cart', `${item.name} was removed from your bag.`);
  };

  if (!items.length) {
    return (
      <div className="container section">
        <EmptyState
          icon={ShoppingBag}
          title="Your bag is empty"
          description="Browse the collection and add something you like. Your cart will be saved on this device."
          action={<Link to="/" className="button button--dark">Start shopping <ArrowRight size={16} /></Link>}
        />
      </div>
    );
  }

  return (
    <div className="container section cart-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Your selection</span>
          <h1>Shopping bag</h1>
          <p>{itemCount} item{itemCount === 1 ? '' : 's'} across {lineCount} product{lineCount === 1 ? '' : 's'}</p>
        </div>
        <Link to="/" className="text-link"><ArrowLeft size={16} /> Continue shopping</Link>
      </div>

      {unavailable ? (
        <div className="notice notice--warning" role="alert">
          <TriangleAlert size={19} />
          <div>
            <strong>Some items need attention</strong>
            <p>One or more products are out of stock. Remove them before checkout, or the server will reject the order.</p>
          </div>
        </div>
      ) : null}

      <div className="cart-layout">
        <div className="cart-items">
          {items.map((item) => {
            const lineTotal = Math.round(item.price * item.quantity * 100) / 100;
            const outOfStock = item.stockQuantity <= 0;
            const lowStock = !outOfStock && item.stockQuantity < 5;
            return (
              <article className={`cart-item${outOfStock ? ' cart-item--unavailable' : ''}`} key={item.productId}>
                <Link to={`/products/${item.productId}`} className="cart-item__media" aria-label={`View ${item.name}`}>
                  <ProductImage src={item.imageUrl} alt={item.name} />
                </Link>

                <div className="cart-item__details">
                  <span className="cart-item__category">{item.category}</span>
                  <Link to={`/products/${item.productId}`} className="cart-item__name">{item.name}</Link>
                  <span className={`stock-note${outOfStock ? ' stock-note--out' : lowStock ? ' stock-note--low' : ''}`}>
                    {outOfStock ? 'Out of stock' : stockLabel(item.stockQuantity)}
                  </span>
                  <span className="cart-item__unit">{formatCurrency(item.price)} each</span>
                </div>

                <div className="cart-item__controls">
                  <QuantityStepper
                    value={item.quantity}
                    onChange={(quantity) => updateQuantity(item.productId, quantity)}
                    max={Math.max(1, item.stockQuantity)}
                    disabled={outOfStock}
                    label={`Quantity for ${item.name}`}
                  />
                  <button
                    type="button"
                    className="icon-button cart-item__remove"
                    onClick={() => handleRemove(item)}
                    aria-label={`Remove ${item.name} from cart`}
                    title="Remove item"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <strong className="cart-item__total">{formatCurrency(lineTotal)}</strong>
              </article>
            );
          })}

          <button
            type="button"
            className="text-link cart-clear"
            onClick={() => {
              if (window.confirm('Remove every item from your shopping bag?')) clearCart();
            }}
          >
            <Trash2 size={15} />
            Clear bag
          </button>
        </div>

        <aside className="cart-summary" aria-label="Order summary">
          <h2>Order summary</h2>
          <dl className="summary-list">
            <div>
              <dt>Subtotal ({itemCount} item{itemCount === 1 ? '' : 's'})</dt>
              <dd>{formatCurrency(subtotal)}</dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd>
                {deliveryFee === 0 ? (
                  <span className="text-success font-semibold">FREE</span>
                ) : (
                  formatCurrency(deliveryFee)
                )}
              </dd>
            </div>
            <div className="summary-list__total">
              <dt>Estimated total</dt>
              <dd>{formatCurrency(estimatedTotal)}</dd>
            </div>
          </dl>

          <p className="summary-note">
            Free delivery on orders over {formatCurrency(FREE_DELIVERY_THRESHOLD)}. The server rechecks every
            price, stock level and delivery fee when your order is placed.
          </p>

          {!user ? (
            <Link to="/login" state={{ from: '/checkout' }} className="button button--primary button--large button--full">
              Sign in to checkout
              <ArrowRight size={17} />
            </Link>
          ) : user.role === 'admin' ? (
            <div className="notice notice--info">
              Admin accounts cannot place customer orders. Sign in with a customer account to check out.
            </div>
          ) : (
            <Link
              to="/checkout"
              className={`button button--primary button--large button--full${unavailable ? ' is-disabled' : ''}`}
              aria-disabled={unavailable}
              onClick={(event) => {
                if (unavailable) event.preventDefault();
              }}
            >
              Proceed to checkout
              <ArrowRight size={17} />
            </Link>
          )}

          <Link to="/" className="button button--ghost button--full">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
