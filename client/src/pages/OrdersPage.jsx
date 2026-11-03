import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, PackageOpen, ReceiptText } from 'lucide-react';
import { api } from '../services/api.js';
import { ErrorPanel, PageLoader } from '../components/Feedback.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatCurrency, formatDate } from '../utils/format.js';

const TABS = [
  { value: 'all', label: 'All orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || 'all';
  const page = Math.max(1, Number.parseInt(searchParams.get('page'), 10) || 1);
  const [state, setState] = useState({ orders: [], pagination: null, loading: true, error: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: null }));
    const params = new URLSearchParams({ page: String(page), limit: '8' });
    if (status !== 'all') params.set('status', status);

    api
      .get(`/orders/my-orders?${params.toString()}`, { signal: controller.signal })
      .then((data) => {
        setState({ orders: data.orders, pagination: data.pagination, loading: false, error: null });
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setState((current) => ({ ...current, loading: false, error: error.message }));
        }
      });
    return () => controller.abort();
  }, [status, page, version]);

  const setStatus = (nextStatus) => {
    const params = new URLSearchParams();
    if (nextStatus !== 'all') params.set('status', nextStatus);
    setSearchParams(params);
  };

  return (
    <div className="container section orders-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Your account</span>
          <h1>My orders</h1>
          <p>Track current orders and revisit previous purchases.</p>
        </div>
        <Link to="/" className="button button--secondary">Continue shopping</Link>
      </div>

      <div className="status-tabs" role="tablist" aria-label="Filter orders by status">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={status === tab.value}
            className={`status-tab${status === tab.value ? ' status-tab--active' : ''}`}
            onClick={() => setStatus(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {state.loading ? <PageLoader label="Loading your orders..." /> : null}
      {state.error ? (
        <ErrorPanel message={state.error} onRetry={() => setVersion((value) => value + 1)} />
      ) : null}

      {!state.loading && !state.error && state.orders.length === 0 ? (
        <EmptyState
          icon={status === 'all' ? PackageOpen : ReceiptText}
          title={status === 'all' ? 'No orders yet' : `No ${status} orders`}
          description={
            status === 'all'
              ? 'When you place an order it will appear here with its live fulfilment status.'
              : 'Try another status filter to see more of your order history.'
          }
          action={<Link to="/" className="button button--dark">Browse products</Link>}
        />
      ) : null}

      {!state.loading && !state.error && state.orders.length > 0 ? (
        <div className="order-list">
          {state.orders.map((order) => (
            <article className="order-card" key={order.id}>
              <div className="order-card__top">
                <div>
                  <span className="order-card__label">Order</span>
                  <strong className="order-card__id">#{order.id}</strong>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="order-card__meta">
                <div>
                  <span>Placed</span>
                  <strong>{formatDate(order.orderDate)}</strong>
                </div>
                <div>
                  <span>Items</span>
                  <strong>{order.itemCount}</strong>
                </div>
                <div>
                  <span>Total</span>
                  <strong>{formatCurrency(order.totalAmount)}</strong>
                </div>
              </div>
              <Link to={`/orders/${order.id}`} className="order-card__link">
                View order
                <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      ) : null}

      {!state.loading && !state.error ? (
        <Pagination
          pagination={state.pagination}
          onPageChange={(nextPage) => {
            const params = new URLSearchParams(searchParams);
            if (nextPage <= 1) params.delete('page');
            else params.set('page', String(nextPage));
            setSearchParams(params);
          }}
        />
      ) : null}
    </div>
  );
}
