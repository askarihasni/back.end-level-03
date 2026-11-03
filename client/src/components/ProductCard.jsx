import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, Plus, ShoppingBag, Star } from 'lucide-react';
import ProductImage from './ProductImage.jsx';
import QuickViewModal from './QuickViewModal.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatCurrency } from '../utils/format.js';

export default function ProductCard({ product, priority = false }) {
  const { addProduct, items } = useCart();
  const toast = useToast();
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const inCart = items.find((item) => item.productId === product.id)?.quantity || 0;
  const outOfStock = product.stockQuantity <= 0;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    const result = addProduct(product, 1, true);
    if (result.added > 0) {
      toast.success('Added to cart', `${product.name} is now in your cart.`);
    } else {
      toast.info('Cart unchanged', result.message || 'Maximum stock limit reached for this product.');
    }
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewOpen(true);
  };

  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite((prev) => !prev);
  };

  return (
    <>
      <article className="kickzone-card">
        {/* Top Media Area with Wishlist Heart & Quick View */}
        <div className="kickzone-card__media-box">
          <button
            type="button"
            className={`kickzone-card__heart ${isFavorite ? 'kickzone-card__heart--active' : ''}`}
            onClick={toggleFavorite}
            aria-label="Add to favorites"
          >
            <Heart size={16} fill={isFavorite ? '#D2F800' : 'none'} color={isFavorite ? '#D2F800' : '#888888'} />
          </button>

          <Link to={`/products/${product.id}`} className="kickzone-card__img-link">
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              className="kickzone-card__img"
              loading={priority ? 'eager' : 'lazy'}
            />
          </Link>

          <button
            type="button"
            className="kickzone-card__quick-btn"
            onClick={handleQuickView}
            aria-label={`Quick view ${product.name}`}
          >
            <Eye size={14} />
            <span>Quick View</span>
          </button>
        </div>

        {/* Card Body */}
        <div className="kickzone-card__body">
          <Link to={`/products/${product.id}`} className="kickzone-card__title">
            {product.name}
          </Link>

          <span className="kickzone-card__category">{product.category}</span>

          {/* Bottom Row: Price & Star Rating */}
          <div className="kickzone-card__bottom-row">
            <span className="kickzone-card__price">{formatCurrency(product.currentPrice)}</span>
            <div className="kickzone-card__rating">
              <span>4.9</span>
              <Star size={12} fill="#D2F800" color="#D2F800" />
            </div>
          </div>

          {/* Action: Add to Cart */}
          <button
            type="button"
            className={`kickzone-card__cart-btn ${outOfStock ? 'kickzone-card__cart-btn--disabled' : ''}`}
            onClick={handleAdd}
            disabled={outOfStock}
          >
            {outOfStock ? (
              <span>Out of Stock</span>
            ) : (
              <>
                <Plus size={14} />
                <span>{inCart > 0 ? `In Cart (${inCart})` : 'Add to Cart'}</span>
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
