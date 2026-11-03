import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Minus, PackageCheck, Plus, ShieldCheck, ShoppingBag } from 'lucide-react';
import { api } from '../services/api.js';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ProductImage from '../components/ProductImage.jsx';
import QuantityStepper from '../components/QuantityStepper.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { ErrorPanel, PageLoader } from '../components/Feedback.jsx';
import { formatCurrency, stockLabel } from '../utils/format.js';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addProduct } = useCart();
  const toast = useToast();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    api
      .get(`/products/${id}`, { signal: controller.signal })
      .then((data) => {
        setProduct(data.product);
        setQuantity(1);
      })
      .catch((fetchError) => {
        if (fetchError.name !== 'AbortError') setError(fetchError.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [id, version]);

  if (loading) return <PageLoader label="Loading product..." />;

  if (error) {
    return (
      <div className="container section">
        <ErrorPanel message={error} onRetry={() => setVersion((value) => value + 1)} />
        <Link to="/" className="button button--secondary" style={{ marginTop: '1rem' }}>
          <ArrowLeft size={16} />
          Back to store
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container section">
        <EmptyState
          title="Product not found"
          description="This product may have been removed or is no longer available."
          action={<Link to="/" className="button button--dark">Browse products</Link>}
        />
      </div>
    );
  }

  const outOfStock = product.stockQuantity <= 0;
  const lowStock = !outOfStock && product.stockQuantity < 5;

  const handleAdd = () => {
    const result = addProduct(product, quantity);
    if (result.added > 0) {
      toast.success('Added to cart', `${result.added} × ${product.name} added to your bag.`);
    } else {
      toast.info('Cart unchanged', result.message || 'This product could not be added.');
    }
  };

  return (
    <div className="container section product-detail-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Store</Link>
        <span>/</span>
        <Link to={`/?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
        <span>/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="product-detail">
        <div className="product-detail__media">
          <ProductImage src={product.imageUrl} alt={product.name} loading="eager" />
        </div>

        <div className="product-detail__info">
          <span className="eyebrow">{product.category}</span>
          <h1>{product.name}</h1>
          <div className="product-detail__price-row">
            <span className="product-detail__price">{formatCurrency(product.currentPrice)}</span>
            <span className={`stock-pill${outOfStock ? ' stock-pill--out' : lowStock ? ' stock-pill--low' : ''}`}>
              {stockLabel(product.stockQuantity)}
            </span>
          </div>

          <p className="product-detail__description">
            {product.description || 'A considered addition to the everyday collection.'}
          </p>

          <div className="product-detail__purchase">
            <div>
              <span className="field-label">Quantity</span>
              <QuantityStepper
                value={quantity}
                onChange={setQuantity}
                max={Math.max(1, product.stockQuantity)}
                disabled={outOfStock}
                label={`Quantity for ${product.name}`}
              />
            </div>
            <button
              type="button"
              className="button button--primary button--large product-detail__add"
              onClick={handleAdd}
              disabled={outOfStock}
            >
              {outOfStock ? (
                <>
                  <ShoppingBag size={18} />
                  Out of stock
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Add to cart
                </>
              )}
            </button>
          </div>

          <div className="product-detail__notes">
            <div>
              <ShieldCheck size={18} />
              <div>
                <strong>Server-verified total</strong>
                <span>Prices and stock are confirmed again during checkout.</span>
              </div>
            </div>
            <div>
              <PackageCheck size={18} />
              <div>
                <strong>Order tracking</strong>
                <span>Follow your order status from your account.</span>
              </div>
            </div>
          </div>

          <button type="button" className="text-link product-detail__back" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            Back to browsing
          </button>
        </div>
      </div>
    </div>
  );
}
