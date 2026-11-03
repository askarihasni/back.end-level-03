import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Banknote,
  CircleDollarSign,
  Clock3,
  PackageSearch,
  ReceiptText,
  TriangleAlert,
  Truck,
  Users,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { ErrorPanel, PageLoader } from '../../components/Feedback.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { formatCurrency, formatDate } from '../../utils/format.js';

const METRIC_CONFIG = [
  { key: 'realizedRevenue', label: 'Realized revenue', icon: Banknote, tone: 'emerald', money: true, hint: 'Paid + shipped orders' },
  { key: 'totalOrders', label: 'Total orders', icon: ReceiptText, tone: 'blue', hint: 'All statuses' },
  { key: 'pendingOrders', label: 'Pending orders', icon: Clock3, tone: 'amber', hint: 'Awaiting processing' },
  { key: 'shippedOrders', label: 'Shipped orders', icon: Truck, tone: 'teal', hint: 'Fulfilled' },
  { key: 'activeProducts', label: 'Active products', icon: PackageSearch, tone: 'violet', hint: 'Visible in store' },
  { key: 'lowStockProducts', label: 'Low-stock products', icon: TriangleAlert, tone: 'rose', hint: 'Fewer than 5 units' },
];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    api
      .get('/admin/dashboard', { signal: controller.signal })
      .then(setData)
      .catch((fetchError) => {
        if (fetchError.name !== 'AbortError') setError(fetchError.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [version]);

  if (loading) return <PageLoader label="Loading dashboard..." />;
  if (error) return <ErrorPanel message={error} onRetry={() => setVersion((value) => value + 1)} />;
  if (!data) return null;

  const { metrics, recentOrders, lowStock } = data;

  return (
    <div className="admin-dashboard">
      <div className="admin-section-heading">
        <div>
          <h2>Business snapshot</h2>
          <p>All figures are live database values. Revenue includes paid and shipped orders only.</p>
        </div>
        <Link to="/admin/analytics" className="button button--secondary button--small">
          Open analytics
          <ArrowRight size={15} />
        </Link>
      </div>

      <div className="metric-grid">
        {METRIC_CONFIG.map(({ key, label, icon: Icon, tone, money, hint }) => (
          <article className={`metric-card metric-card--${tone}`} key={key}>
            <span className="metric-card__icon" aria-hidden="true"><Icon size={20} /></span>
            <span className="metric-card__label">{label}</span>
            <strong className="metric-card__value">
              {money ? formatCurrency(metrics[key]) : metrics[key].toLocaleString()}
            </strong>
            <span className="metric-card__hint">{hint}</span>
          </article>
        ))}
      </div>

      <div className="secondary-metrics">
        <div>
          <Users size={18} />
          <span>Customers</span>
          <strong>{metrics.totalCustomers}</strong>
        </div>
        <div>
          <CircleDollarSign size={18} />
          <span>Average realized order</span>
          <strong>{formatCurrency(metrics.averageQualifyingOrderValue)}</strong>
        </div>
        <div>
          <ReceiptText size={18} />
          <span>Paid orders awaiting shipment</span>
          <strong>{metrics.paidOrders}</strong>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="panel dashboard-orders">
          <div className="panel__header">
            <div>
              <h2>Recent orders</h2>
              <p>Latest activity across the store</p>
            </div>
            <Link to="/admin/orders" className="text-link">View all <ArrowRight size={15} /></Link>
          </div>

          {recentOrders.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title="No orders yet"
              description="New customer orders will appear here as soon as they are placed."
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table data-table--compact">
                <thead>
                  <tr>
                    <th scope="col">Order</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Date</th>
                    <th scope="col">Items</th>
                    <th scope="col">Total</th>
                    <th scope="col">Status</th>
                    <th scope="col" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td><strong>#{order.id}</strong></td>
                      <td>{order.customerName}</td>
                      <td>{formatDate(order.orderDate)}</td>
                      <td>{order.itemCount}</td>
                      <td>{formatCurrency(order.totalAmount)}</td>
                      <td><StatusBadge status={order.status} /></td>
                      <td className="align-right">
                        <Link to={`/admin/orders/${order.id}`} className="table-link">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel dashboard-low-stock">
          <div className="panel__header">
            <div>
              <h2>Low stock</h2>
              <p>Products with fewer than five units</p>
            </div>
            <Link to="/admin/products" className="text-link">Manage</Link>
          </div>
          {lowStock.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="Stock levels look healthy"
              description="No active product is below the low-stock threshold."
            />
          ) : (
            <ul className="low-stock-list">
              {lowStock.map((product) => (
                <li key={product.productId}>
                  <div>
                    <strong>{product.productName}</strong>
                    <span>{product.category} · {formatCurrency(product.currentPrice)}</span>
                  </div>
                  <span className={`stock-pill${product.stockQuantity === 0 ? ' stock-pill--out' : ' stock-pill--low'}`}>
                    {product.stockQuantity === 0 ? 'Out of stock' : `${product.stockQuantity} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
