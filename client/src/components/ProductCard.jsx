import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Eye, Plus, ShoppingBag, Star } from 'lucide-react';
import ProductImage from './ProductImage.jsx';
import QuickViewModal from './QuickViewModal.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatCurrency, stockLabel } from '../utils/format.js';

export default function ProductCard({ product, priority = false }) {
  const { addProduct, items } = useCart();
  const toast = useToast();
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [addedAnim, setAddedAnim] = useState(false);

  const inCart = items.find((item) => item.productId === product.id)?.quantity || 0;
  const outOfStock = product.stockQuantity <= 0;
  const lowStock = !outOfStock && product.stockQuantity < 5;
  const originalPrice = Math.round(Number(product.currentPrice) * 1.2);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    const result = addProduct(product, 1, true);
    if (result.added > 0) {
      setAddedAnim(true);
      toast.success('Added to cart', `${product.name} is now in your cart.`);
      setTimeout(() => setAddedAnim(false), 1800);
    } else {
      toast.info('Cart unchanged', result.message || 'Maximum stock limit reached for this product.');
    }
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewOpen(true);
  };

  return (
    <>
      <article className="product-card">
        <div className="product-card__media-wrap">
          <Link
            to={`/products/${product.id}`}
            className="product-card__media"
            aria-label={`View ${product.name}`}
          >
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              loading={priority ? 'eager' : 'lazy'}
            />
            {outOfStock ? (
              <span className="product-card__overlay">Out of Stock</span>
            ) : lowStock ? (
              <span className="product-card__flag product-card__flag--low">
                Only {product.stockQuantity} left
              </span>
            ) : (
              <span className="product-card__flag product-card__flag--save">
                SAVE 20%
              </span>
            )}
          </Link>

          {/* Quick View Button overlay */}
          <button
            type="button"
            className="product-card__quick-btn"
            onClick={handleQuickView}
            aria-label={`Quick view ${product.name}`}
            title="Quick view"
          >
            <Eye size={15} />
            <span>Quick View</span>
          </button>
        </div>

        <div className="product-card__body">
          <div className="product-card__header-meta">
            <span className="product-card__category">{product.category}</span>
            <div className="product-card__stars" title="Rated 4.9 out of 5 stars">
              <Star size={11} fill="#F59E0B" color="#F59E0B" />
              <span>4.9</span>
            </div>
          </div>

          <Link to={`/products/${product.id}`} className="product-card__name">
            {product.name}
          </Link>

          <div className="product-card__pricing">
            <span className="product-card__price">{formatCurrency(product.currentPrice)}</span>
            <span className="product-card__orig-price">{formatCurrency(originalPrice)}</span>
          </div>

          <div className="product-card__footer-meta">
            <span
              className={`stock-indicator ${
                outOfStock
                  ? 'stock-indicator--out'
                  : lowStock
                  ? 'stock-indicator--low'
                  : 'stock-indicator--in'
              }`}
            >
              <span className="stock-dot" />
              {stockLabel(product.stockQuantity)}
            </span>
          </div>

          <button
            type="button"
            className={`button product-card__button ${
              outOfStock
                ? 'button--secondary'
                : addedAnim
                ? 'button--success'
                : 'button--primary'
            }`}
            onClick={handleAdd}
            disabled={outOfStock}
            aria-label={
              outOfStock ? `${product.name} is out of stock` : `Add ${product.name} to cart`
            }
          >
            {outOfStock ? (
              <>
                <ShoppingBag size={15} />
                <span>Unavailable</span>
              </>
            ) : addedAnim ? (
              <>
                <Check size={15} />
                <span>Added!</span>
              </>
            ) : (
              <>
                <Plus size={15} />
                <span>Add to Cart{inCart > 0 ? ` (${inCart})` : ''}</span>
              </>
            )}
          </button>
        </div>
      </article>

      {quickViewOpen && (
        <QuickViewModal
          product={{
            id: product.id,
            name: product.name,
            description: product.description,
            current_price: product.currentPrice,
            stock_quantity: product.stockQuantity,
            category: product.category,
            image_url: product.imageUrl,
          }}
          onClose={() => setQuickViewOpen(false)}
        />
      )}
    </>
  );
}
