import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Info, Truck, XCircle } from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ErrorPanel, PageLoader } from '../../components/Feedback.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import ProductImage from '../../components/ProductImage.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatCurrency, formatDateTime } from '../../utils/format.js';

function confirmCopy(order, nextStatus) {
  if (nextStatus === 'paid') {
    return {
      title: `Mark order #${order.id} as paid?`,
      message: 'This records a manual status change only. No payment provider is integrated and no real payment will be processed.',
    };
  }
  if (nextStatus === 'shipped') {
    return {
      title: `Mark order #${order.id} as shipped?`,
      message: 'The order will move to its final fulfilment state. This cannot be undone.',
    };
  }
  if (order.status === 'paid') {
    return {
      title: `Cancel paid order #${order.id}?`,
      message: 'Inventory will be restored. No payment provider is integrated, so a refund must be handled manually; this action does not process a refund.',
    };
  }
  return {
    title: `Cancel order #${order.id}?`,
    message: 'Reserved stock will be restored to the catalogue. This cannot be undone.',
  };
}

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);
  const [confirm, setConfirm] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [transition, setTransition] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    api
      .get(`/admin/orders/${id}`, { signal: controller.signal })
      .then(setData)
      .catch((fetchError) => {
        if (fetchError.name !== 'AbortError') setError(fetchError.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [id, version]);

  if (loading) return <PageLoader label="Loading order..." />;
  if (error) {
    return (
      <div>
        <ErrorPanel message={error} title="Order unavailable" onRetry={() => setVersion((value) => value + 1)} />
        <Link to="/admin/orders" className="button button--secondary" style={{ marginTop: '1rem' }}>
          <ArrowLeft size={16} />
          Back to orders
        </Link>
      </div>
    );
  }
  if (!data) return null;

  const { order, allowedNextStatuses } = data;
  const canPay = allowedNextStatuses.includes('paid');
  const canShip = allowedNextStatuses.includes('shipped');
  const canCancel = allowedNextStatuses.includes('cancelled');

  const openConfirm = (nextStatus) => {
    setConfirm({ nextStatus, ...confirmCopy(order, nextStatus) });
  };

  const applyStatus = async () => {
    if (!confirm) return;
    setUpdating(true);
    try {
      const result = await api.patch(`/admin/orders/${order.id}/status`, { status: confirm.nextStatus });
      setData({ order: result.order, allowedNextStatuses: result.allowedNextStatuses });
      setTransition(result.transition);
      toast.success('Order updated', `Order #${order.id} is now ${confirm.nextStatus}.`);
      setConfirm(null);
    } catch (updateError) {
      toast.error('Could not update order', updateError.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="admin-order-detail">
      <Link to="/admin/orders" className="text-link admin-back">
        <ArrowLeft size={16} />
        Back to orders
      </Link>

      <div className="admin-detail-header">
        <div>
          <span className="eyebrow">Order #{order.id}</span>
          <h2>{order.customerName}</h2>
          <p>Placed {formatDateTime(order.orderDate)} · {order.itemCount} item{order.itemCount === 1 ? '' : 's'}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {transition ? (
        <div className="notice notice--info" role="status">
          <Info size={19} />
          <div>
            <strong>
              {transition.from} → {transition.to}
            </strong>
            <p>{transition.note}</p>
            {transition.inventoryRestored ? <p>Inventory was restored for this order.</p> : null}
            {transition.refundRequired ? <p>A manual refund is marked as required. It has not been processed.</p> : null}
          </div>
        </div>
      ) : null}

      <div className="admin-detail-grid">
        <section className="panel">
          <div className="panel__header"><h2>Customer</h2></div>
          <dl className="detail-list">
            <div><dt>Name</dt><dd>{order.customerName}</dd></div>
            <div><dt>Email</dt><dd>{order.customerEmail}</dd></div>
            <div><dt>Customer ID</dt><dd>#{order.userId}</dd></div>
            <div><dt>Last updated</dt><dd>{formatDateTime(order.updatedAt)}</dd></div>
          </dl>
        </section>

        <section className="panel">
          <div className="panel__header"><h2>Fulfilment</h2></div>
          <div className="fulfilment-actions">
            {canPay ? (
              <button type="button" className="button button--primary" onClick={() => openConfirm('paid')}>
                <CheckCircle2 size={16} />
                Mark as paid
              </button>
            ) : null}
            {canShip ? (
              <button type="button" className="button button--primary" onClick={() => openConfirm('shipped')}>
                <Truck size={16} />
                Mark as shipped
              </button>
            ) : null}
            {canCancel ? (
              <button type="button" className="button button--danger" onClick={() => openConfirm('cancelled')}>
                <XCircle size={16} />
                Cancel order
              </button>
            ) : null}
            {!canPay && !canShip && !canCancel ? (
              <p className="panel__hint">This order is in a terminal state and cannot be changed.</p>
            ) : null}
          </div>
          <div className="notice notice--info">
            <Info size={18} />
            <div>
              <strong>No payment provider connected</strong>
              <p>Status changes are recorded in PostgreSQL only. Paid orders are marked manually; cancellations of paid orders require a manual refund outside this system.</p>
            </div>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel__header">
          <h2>Order items</h2>
          <span>{order.itemCount} item{order.itemCount === 1 ? '' : 's'}</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Purchased price</th>
                <th scope="col">Current price</th>
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
                  <td>{formatCurrency(item.currentProductPrice)}</td>
                  <td>{item.quantity}</td>
                  <td className="align-right"><strong>{formatCurrency(item.lineTotal)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-order-total">
          <span>Database-calculated total</span>
          <strong>{formatCurrency(order.totalAmount)}</strong>
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title || ''}
        message={confirm?.message || ''}
        confirmLabel={confirm?.nextStatus === 'cancelled' ? 'Cancel order' : confirm?.nextStatus === 'paid' ? 'Mark as paid' : 'Mark as shipped'}
        tone={confirm?.nextStatus === 'cancelled' ? 'danger' : 'primary'}
        loading={updating}
        onConfirm={applyStatus}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
