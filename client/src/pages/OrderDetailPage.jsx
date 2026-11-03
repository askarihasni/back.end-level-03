import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CircleDollarSign, PackageCheck, Truck, XCircle } from 'lucide-react';
import { api } from '../services/api.js';
import { ErrorPanel, PageLoader } from '../components/Feedback.jsx';
import ProductImage from '../components/ProductImage.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatCurrency, formatDateTime } from '../utils/format.js';

const STEPS = [
  { status: 'pending', label: 'Order placed', icon: PackageCheck },
  { status: 'paid', label: 'Payment recorded', icon: CircleDollarSign },
  { status: 'shipped', label: 'Shipped', icon: Truck },
];

function orderStepIndex(status) {
  if (status === 'pending') return 0;
  if (status === 'paid') return 1;
  if (status === 'shipped') return 2;
  return -1;
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
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

  if (loading) return <PageLoader label="Loading order..." />;

  if (error) {
    return (
      <div className="container section">
        <ErrorPanel message={error} title="Order unavailable" />
        <Link to="/orders" className="button button--secondary" style={{ marginTop: '1rem' }}>
          <ArrowLeft size={16} />
          Back to orders
        </Link>
      </div>
    );
  }

  if (!order) return null;
  const stepIndex = orderStepIndex(order.status);
  const cancelled = order.status === 'cancelled';

  return (
    <div className="container section order-detail-page">
      <Link to="/orders" className="text-link checkout-back">
        <ArrowLeft size={16} />
        Back to orders
      </Link>

      <div className="page-heading">
        <div>
          <span className="eyebrow">Order details</span>
          <h1>Order #{order.id}</h1>
          <p>Placed {formatDateTime(order.orderDate)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {cancelled ? (
        <div className="notice notice--error">
          <XCircle size={19} />
          <div>
            <strong>This order was cancelled</strong>
            <p>No further fulfilment steps will be taken for this order.</p>
          </div>
        </div>
      ) : (
        <ol className="order-timeline" aria-label="Order progress">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const complete = index <= stepIndex;
            return (
              <li key={step.status} className={complete ? 'is-complete' : ''}>
                <span className="order-timeline__icon"><Icon size={17} /></span>
                <span>{step.label}</span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="order-detail-layout">
        <section className="panel order-detail-items">
          <div className="panel__header">
            <h2>Items</h2>
            <span>{order.itemCount} item{order.itemCount === 1 ? '' : 's'}</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Unit price</th>
                  <th scope="col">Qty</th>
                  <th scope="col" className="align-right">Line total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="table-product">
                        <ProductImage src={item.productImageUrl} alt={item.productName} />
                        <div>
                          <Link to={`/products/${item.productId}`}>{item.productName}</Link>
                          <span>{item.category}</span>
                        </div>
                      </div>
                    </td>
                    <td>{formatCurrency(item.unitPriceAtPurchase)}</td>
                    <td>{item.quantity}</td>
                    <td className="align-right">{formatCurrency(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="panel__hint">
            Purchase prices are historical snapshots from the moment this order was created. Later
            catalogue price changes do not affect this order.
          </p>
        </section>

        <aside className="panel order-detail-summary">
          <h2>Summary</h2>
          <dl className="summary-list">
            <div>
              <dt>Items</dt>
              <dd>{order.itemCount}</dd>
            </div>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatCurrency(order.totalAmount)}</dd>
            </div>
            <div className="summary-list__total">
              <dt>Order total</dt>
              <dd>{formatCurrency(order.totalAmount)}</dd>
            </div>
          </dl>
          <div className="order-detail-customer">
            <span>Customer</span>
            <strong>{order.customerName}</strong>
            <span>{order.customerEmail}</span>
          </div>
          <div className="notice notice--info">
            This demo does not integrate a payment provider. Status changes are performed by the
            store team from the admin dashboard.
          </div>
        </aside>
      </div>
    </div>
  );
}
