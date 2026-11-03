export function Spinner({ size = 'md', label = 'Loading' }) {
  return <span className={`spinner spinner--${size}`} role="status" aria-label={label} />;
}

export function PageLoader({ label = 'Loading' }) {
  return (
    <div className="page-loader" role="status">
      <Spinner size="lg" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorPanel({ message, onRetry, title = 'Something went wrong' }) {
  return (
    <div className="error-panel" role="alert">
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
      {onRetry ? (
        <button type="button" className="button button--secondary button--small" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="product-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div className="product-card product-card--skeleton" key={index}>
          <div className="skeleton skeleton--image" />
          <div className="skeleton skeleton--line skeleton--short" />
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--line skeleton--medium" />
          <div className="skeleton skeleton--button" />
        </div>
      ))}
    </div>
  );
}
