import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, PackageCheck } from 'lucide-react';
import { api } from '../services/api.js';
import { ErrorPanel, PageLoader } from '../components/Feedback.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatCurrency, formatDateTime } from '../utils/format.js';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const location = useLocation();
  const initialOrder = location.state?.order?.id === Number(id) ? location.state.order : null;
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(!initialOrder);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    api
      .get(`/orders/${id}`, { signal: controller.signal })
      .then((data) => setOrder(data.order))
      .catch((fetchError) => {
        if (fetchError.name !== 'AbortError') setError(fetchError.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [id]);

  if (loading && !order) return <PageLoader label="Loading your order..." />;

  if (error) {
    return (
      <div className="container section">
        <ErrorPanel message={error} title="Order unavailable" />
        <Link to="/orders" className="button button--dark" style={{ marginTop: '1rem' }}>View my orders</Link>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="container section confirmation-page">
      <div className="confirmation-hero">
        <span className="confirmation-hero__icon" aria-hidden="true">
          <CheckCircle2 size={38} />
        </span>
        <span className="eyebrow">Order confirmed</span>
        <h1>Thank you, your order is in.</h1>
        <p>
          Order <strong>#{order.id}</strong> was created successfully. The final total below was
          calculated and stored by PostgreSQL.
        </p>
      </div>

      <div className="confirmation-card">
        <div className="confirmation-card__summary">
          <div>
            <span>Order number</span>
            <strong>#{order.id}</strong>
          </div>
          <div>
            <span>Order date</span>
            <strong>{formatDateTime(order.orderDate)}</strong>
          </div>
          <div>
            <span>Status</span>
            <StatusBadge status={order.status} />
          </div>
          <div>
            <span>Actual total</span>
            <strong className="confirmation-card__total">{formatCurrency(order.totalAmount)}</strong>
          </div>
        </div>

        {order.shippingAddress && (
          <div className="confirmation-shipping-dest">
            <span className="text-xs text-muted font-bold uppercase tracking-wider block mb-1">Shipping Destination</span>
            <p className="text-sm">{order.shippingAddress}</p>
          </div>
        )}

        <ul className="confirmation-items">
          {order.items.map((item) => (
            <li key={item.id}>
              <div>
                <strong>{item.productName}</strong>
                <span>{item.quantity} × {formatCurrency(item.unitPriceAtPurchase)}</span>
              </div>
              <strong>{formatCurrency(item.lineTotal)}</strong>
            </li>
          ))}
        </ul>

        <div className="notice notice--info">
          <PackageCheck size={19} />
          <div>
            <strong>What happens next?</strong>
            <p>
              The store team will review and update the order status. You can follow progress from
              your order history. No online payment was processed in this demo.
            </p>
          </div>
        </div>

        <div className="confirmation-actions">
          <Link to={`/orders/${order.id}`} className="button button--dark">
            View order details
            <ArrowRight size={16} />
          </Link>
          <Link to="/" className="button button--secondary">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
