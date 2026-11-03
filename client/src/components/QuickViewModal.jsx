import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ExternalLink, ShieldCheck, ShoppingBag, Star, Truck, X } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatCurrency } from '../utils/format.js';
import ProductImage from './ProductImage.jsx';
import QuantityStepper from './QuantityStepper.jsx';

export default function QuickViewModal({ product, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addProduct } = useCart();
  const { showToast } = useToast();

  if (!product) return null;

  const inStock = product.stock_quantity > 0;
  const isLowStock = inStock && product.stock_quantity < 5;
  const originalPrice = Math.round(Number(product.current_price) * 1.2);

  const handleAddToCart = () => {
    if (!inStock) return;
    const result = addProduct(product, quantity, false);
    if (result.added > 0) {
      setAdded(true);
      showToast({
        title: 'Added to Cart',
        message: `${quantity} × ${product.name} added to your bag.`,
        type: 'success',
      });
      setTimeout(() => setAdded(false), 2200);
    }
  };

  return (
    <div className="quickview-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="quickview-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="quickview-close-btn"
          onClick={onClose}
          aria-label="Close preview"
        >
          <X size={20} />
        </button>

        <div className="quickview-grid">
          <div className="quickview-media">
            <ProductImage src={product.image_url} alt={product.name} />
            <div className="quickview-badge-wrap">
              {isLowStock ? (
                <span className="badge badge--warning">Only {product.stock_quantity} left</span>
              ) : inStock ? (
                <span className="badge badge--success">In Stock</span>
              ) : (
                <span className="badge badge--danger">Out of Stock</span>
              )}
            </div>
          </div>

          <div className="quickview-content">
            <div className="quickview-meta">
              <span className="quickview-category">{product.category}</span>
              <div className="quickview-rating">
                <div className="stars-row" aria-label="5 stars rating">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} fill="#F59E0B" color="#F59E0B" />
                  ))}
                </div>
                <span className="rating-num">4.9</span>
                <span className="rating-count">(340+ reviews)</span>
              </div>
            </div>

            <h3 className="quickview-title">{product.name}</h3>

            <div className="quickview-price-row">
              <span className="quickview-price">{formatCurrency(product.current_price)}</span>
              <span className="quickview-original-price">{formatCurrency(originalPrice)}</span>
              <span className="quickview-save-tag">SAVE 20%</span>
            </div>

            <p className="quickview-description">{product.description}</p>

            <div className="quickview-perks">
              <div className="quickview-perk">
                <Truck size={15} className="text-blue" />
                <span>Express Insured Shipping</span>
              </div>
              <div className="quickview-perk">
                <ShieldCheck size={15} className="text-blue" />
                <span>2-Year Official NEXORA Warranty</span>
              </div>
            </div>

            <div className="quickview-actions">
              {inStock ? (
                <>
                  <div className="quickview-quantity-wrap">
                    <label className="text-xs text-muted block mb-1">Quantity</label>
                    <QuantityStepper
                      quantity={quantity}
                      stock={product.stock_quantity}
                      onChange={setQuantity}
                    />
                  </div>
                  <button
                    type="button"
                    className={`button button--large flex-1 ${
                      added ? 'button--success' : 'button--primary'
                    }`}
                    onClick={handleAddToCart}
                  >
                    {added ? (
                      <>
                        <Check size={18} />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={18} />
                        <span>Add to Cart — {formatCurrency(Number(product.current_price) * quantity)}</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button type="button" className="button button--secondary button--large flex-1" disabled>
                  Out of Stock
                </button>
              )}
            </div>

            <div className="quickview-footer">
              <Link
                to={`/products/${product.id}`}
                onClick={onClose}
                className="quickview-full-link"
              >
                <span>View Full Product Specifications</span>
                <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

