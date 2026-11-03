import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  Banknote,
  ChartNoAxesCombined,
  Crown,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { ErrorPanel, PageLoader } from '../../components/Feedback.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { formatCurrency, formatMonth } from '../../utils/format.js';

function growthClass(value) {
  if (value === null || value === undefined) return '';
  return value >= 0 ? 'growth growth--positive' : 'growth growth--negative';
}

function GrowthIcon({ value }) {
  if (value === null || value === undefined) return null;
  return value >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    Promise.all([
      api.get('/admin/analytics/revenue', { signal: controller.signal }),
      api.get('/admin/analytics/top-spenders', { signal: controller.signal }),
      api.get('/admin/analytics/low-stock', { signal: controller.signal }),
    ])
      .then(([revenue, spenders, lowStock]) => {
        setData({
          months: revenue.months,
          revenueRule: revenue.revenueRule,
          spenders: spenders.spenders,
          spendersRule: spenders.revenueRule,
          lowStock: lowStock.products,
        });
      })
      .catch((fetchError) => {
        if (fetchError.name !== 'AbortError') setError(fetchError.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [version]);

  if (loading) return <PageLoader label="Loading analytics..." />;
  if (error) return <ErrorPanel message={error} onRetry={() => setVersion((value) => value + 1)} />;
  if (!data) return null;

  const { months, spenders, lowStock } = data;
  const maxRevenue = months.reduce((max, month) => Math.max(max, month.monthlyRevenue), 0) || 1;
  const cumulative = months.length ? months[months.length - 1].cumulativeRevenue : 0;
  const bestMonth = months.reduce(
    (best, month) => (!best || month.monthlyRevenue > best.monthlyRevenue ? month : best),
    null
  );
  const latest = months.length ? months[months.length - 1] : null;
  const zeroStockCount = lowStock.filter((product) => product.stockQuantity === 0).length;

  return (
    <div className="admin-analytics-page">
      <div className="admin-section-heading">
        <div>
          <h2>Revenue & customer insights</h2>
          <p>{data.revenueRule}</p>
        </div>
      </div>

      <div className="analytics-metrics">
        <article className="analytics-metric">
          <span className="analytics-metric__icon"><Banknote size={19} /></span>
          <span>Realized revenue</span>
          <strong>{formatCurrency(cumulative)}</strong>
          <small>Paid + shipped, historical prices</small>
        </article>
        <article className="analytics-metric">
          <span className="analytics-metric__icon"><ChartNoAxesCombined size={19} /></span>
          <span>Best month</span>
          <strong>{bestMonth ? formatMonth(bestMonth.revenueMonth) : '—'}</strong>
          <small>{bestMonth ? formatCurrency(bestMonth.monthlyRevenue) : 'No realized revenue yet'}</small>
        </article>
        <article className="analytics-metric">
          <span className="analytics-metric__icon"><Crown size={19} /></span>
          <span>Latest month growth</span>
          <strong className={growthClass(latest?.monthOverMonthGrowthPct)}>
            <GrowthIcon value={latest?.monthOverMonthGrowthPct} />
            {latest?.monthOverMonthGrowthPct === null || latest?.monthOverMonthGrowthPct === undefined
              ? '—'
              : `${latest.monthOverMonthGrowthPct.toFixed(2)}%`}
          </strong>
          <small>Month over month</small>
        </article>
        <article className="analytics-metric">
          <span className="analytics-metric__icon"><TriangleAlert size={19} /></span>
          <span>Low-stock items</span>
          <strong>{lowStock.length}</strong>
          <small>{zeroStockCount} currently out of stock</small>
        </article>
      </div>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h2>Monthly revenue</h2>
            <p>Calendar months with zero qualifying revenue are shown explicitly.</p>
          </div>
        </div>

        {months.length === 0 ? (
          <EmptyState title="No revenue data" description="Realized revenue appears once an order is paid or shipped." />
        ) : (
          <>
            <div className="revenue-chart-wrap">
              <div
                className="revenue-chart"
                role="img"
                aria-label={`Monthly realized revenue from ${formatMonth(months[0].revenueMonth)} to ${formatMonth(months[months.length - 1].revenueMonth)}`}
              >
                {months.map((month) => {
                  const height = month.monthlyRevenue === 0 ? 2 : Math.max(6, (month.monthlyRevenue / maxRevenue) * 100);
                  return (
                    <div className="revenue-bar-group" key={month.revenueMonth}>
                      <div className="revenue-bar-track">
                        <div
                          className={`revenue-bar${month.monthlyRevenue === 0 ? ' revenue-bar--empty' : ''}`}
                          style={{ height: `${height}%` }}
                          title={`${formatMonth(month.revenueMonth)}: ${formatCurrency(month.monthlyRevenue)}`}
                        >
                          <span className="revenue-bar__value">{formatCurrency(month.monthlyRevenue)}</span>
                        </div>
                      </div>
                      <span className="revenue-bar__label">{formatMonth(month.revenueMonth)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="table-wrap">
              <table className="data-table analytics-table">
                <thead>
                  <tr>
                    <th scope="col">Month</th>
                    <th scope="col" className="align-right">Monthly revenue</th>
                    <th scope="col" className="align-right">Previous month</th>
                    <th scope="col" className="align-right">Growth</th>
                    <th scope="col" className="align-right">Cumulative</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((month) => (
                    <tr key={month.revenueMonth}>
                      <td><strong>{formatMonth(month.revenueMonth)}</strong></td>
                      <td className="align-right">{formatCurrency(month.monthlyRevenue)}</td>
                      <td className="align-right">
                        {month.previousMonthRevenue === null ? '—' : formatCurrency(month.previousMonthRevenue)}
                      </td>
                      <td className={`align-right ${growthClass(month.monthOverMonthGrowthPct)}`}>
                        {month.monthOverMonthGrowthPct === null ? '—' : `${month.monthOverMonthGrowthPct.toFixed(2)}%`}
                      </td>
                      <td className="align-right"><strong>{formatCurrency(month.cumulativeRevenue)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <div className="analytics-grid">
        <section className="panel">
          <div className="panel__header">
            <div>
              <h2>Top five spenders</h2>
              <p>{data.spendersRule}</p>
            </div>
            <Award size={20} />
          </div>
          {spenders.length === 0 ? (
            <EmptyState title="No qualifying spenders" description="Customers with paid or shipped orders will appear here." />
          ) : (
            <ol className="spender-list">
              {spenders.map((spender, index) => (
                <li key={spender.customerId}>
                  <span className="spender-list__rank">{index + 1}</span>
                  <div className="spender-list__person">
                    <strong>{spender.customerName}</strong>
                    <span>{spender.customerEmail}</span>
                  </div>
                  <div className="spender-list__orders">
                    <span>{spender.qualifyingOrders} order{spender.qualifyingOrders === 1 ? '' : 's'}</span>
                    <strong>{formatCurrency(spender.totalSpent)}</strong>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <h2>Low-stock alerts</h2>
              <p>Live from the vw_low_stock database view.</p>
            </div>
            <Link to="/admin/products" className="text-link">Manage <ArrowRight size={15} /></Link>
          </div>
          {lowStock.length === 0 ? (
            <EmptyState title="Stock levels look healthy" description="No product has fewer than five units." />
          ) : (
            <div className="table-wrap">
              <table className="data-table data-table--compact">
                <thead>
                  <tr>
                    <th scope="col">Product</th>
                    <th scope="col">Category</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="align-right">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((product) => (
                    <tr key={product.productId} className={product.stockQuantity === 0 ? 'row-critical' : undefined}>
                      <td><strong>{product.productName}</strong></td>
                      <td>{product.category}</td>
                      <td>{product.isActive ? 'Active' : 'Inactive'}</td>
                      <td className="align-right">
                        <span className={`stock-pill${product.stockQuantity === 0 ? ' stock-pill--out' : ' stock-pill--low'}`}>
                          {product.stockQuantity === 0 ? 'Out of stock' : `${product.stockQuantity} left`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
