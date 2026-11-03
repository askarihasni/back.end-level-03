import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Search,
  Truck,
  X,
  XCircle,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useDebouncedValue } from '../../hooks/useProducts.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ErrorPanel, PageLoader } from '../../components/Feedback.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Pagination from '../../components/Pagination.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { formatCurrency, formatDate } from '../../utils/format.js';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'cancelled', label: 'Cancelled' },
];

function actionsFor(status) {
  if (status === 'pending') {
    return [
      { status: 'paid', label: 'Mark paid', icon: CheckCircle2, tone: 'primary' },
      { status: 'cancelled', label: 'Cancel', icon: XCircle, tone: 'danger' },
    ];
  }
  if (status === 'paid') {
    return [
      { status: 'shipped', label: 'Ship', icon: Truck, tone: 'primary' },
      { status: 'cancelled', label: 'Cancel', icon: XCircle, tone: 'danger' },
    ];
  }
  return [];
}

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

export default function AdminOrdersPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ orders: [], pagination: null, loading: true, error: null });
  const [version, setVersion] = useState(0);
  const [confirm, setConfirm] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: null }));
    const params = new URLSearchParams({ page: String(page), limit: '10' });
    if (status !== 'all') params.set('status', status);
    if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());

    api
      .get(`/admin/orders?${params.toString()}`, { signal: controller.signal })
      .then((data) => {
        setState({ orders: data.orders, pagination: data.pagination, loading: false, error: null });
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setState((current) => ({ ...current, loading: false, error: error.message }));
        }
      });
    return () => controller.abort();
  }, [page, status, debouncedSearch, version]);

  const openConfirm = (order, nextStatus) => {
    setConfirm({ order, nextStatus, ...confirmCopy(order, nextStatus) });
  };

  const applyStatus = async () => {
    if (!confirm) return;
    setUpdating(true);
    try {
      const data = await api.patch(`/admin/orders/${confirm.order.id}/status`, {
        status: confirm.nextStatus,
      });
      toast.success(
        'Order updated',
        `Order #${confirm.order.id} is now ${confirm.nextStatus}. ${data.transition?.note || ''}`.trim()
      );
      setConfirm(null);
      setVersion((value) => value + 1);
    } catch (error) {
      toast.error('Could not update order', error.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="admin-orders-page">
      <div className="admin-section-heading">
        <div>
          <h2>Order queue</h2>
          <p>Review, search and move orders through fulfilment.</p>
        </div>
        {state.pagination ? (
          <span className="admin-count">{state.pagination.total} order{state.pagination.total === 1 ? '' : 's'}</span>
        ) : null}
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order ID, customer or email"
            aria-label="Search orders"
          />
          {search ? (
            <button type="button" className="icon-button icon-button--small" onClick={() => setSearch('')} aria-label="Clear search">
              <X size={15} />
            </button>
          ) : null}
        </div>
        <label className="select-field">
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            {STATUS_OPTIONS.map((option) => (
              <option value={option.value} key={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      {state.error ? <ErrorPanel message={state.error} onRetry={() => setVersion((value) => value + 1)} /> : null}
      {state.loading ? <PageLoader label="Loading orders..." /> : null}

      {!state.loading && !state.error && state.orders.length === 0 ? (
        <EmptyState
          title="No orders found"
          description="Try a different search term or status filter."
          action={
            <button type="button" className="button button--secondary" onClick={() => { setSearch(''); setStatus('all'); }}>
              Clear filters
            </button>
          }
        />
      ) : null}

      {!state.loading && !state.error && state.orders.length > 0 ? (
        <div className="panel panel--flush">
          <div className="table-wrap">
            <table className="data-table admin-order-table">
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Date</th>
                  <th scope="col">Items</th>
                  <th scope="col">Total</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.orders.map((order) => (
                  <tr key={order.id}>
                    <td><strong>#{order.id}</strong></td>
                    <td>
                      <div className="table-customer">
                        <strong>{order.customerName}</strong>
                        <span>{order.customerEmail}</span>
                      </div>
                    </td>
                    <td>{formatDate(order.orderDate)}</td>
                    <td>{order.itemCount}</td>
                    <td><strong>{formatCurrency(order.totalAmount)}</strong></td>
                    <td><StatusBadge status={order.status} /></td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/admin/orders/${order.id}`} className="table-link">View</Link>
                        {actionsFor(order.status).map((action) => {
                          const Icon = action.icon;
                          return (
                            <button
                              type="button"
                              key={action.status}
                              className={`table-action${action.tone === 'danger' ? ' table-action--danger' : ''}`}
                              onClick={() => openConfirm(order, action.status)}
                            >
                              <Icon size={14} />
                              {action.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {!state.loading && !state.error ? (
        <Pagination pagination={state.pagination} onPageChange={setPage} />
      ) : null}

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
