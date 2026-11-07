import { useEffect, useRef, useState } from 'react';
import {
  Boxes,
  CheckCircle2,
  ImagePlus,
  Link as LinkIcon,
  PackagePlus,
  Pencil,
  Search,
  ToggleLeft,
  ToggleRight,
  UploadCloud,
  X,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useCategories, useDebouncedValue } from '../../hooks/useProducts.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ErrorPanel, PageLoader, Spinner } from '../../components/Feedback.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Pagination from '../../components/Pagination.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import ProductImage from '../../components/ProductImage.jsx';
import { formatCurrency } from '../../utils/format.js';

const IMAGE_OPTIONS = [
  '/images/hero-speaker.svg',
  '/images/dual-speakers.svg',
  '/images/sound-tower.svg',
  '/images/electronics.svg',
  '/images/audio.svg',
  '/images/accessories.svg',
  '/images/home.svg',
  '/images/fashion.svg',
  '/images/sports.svg',
  '/images/fallback.svg',
];

const EMPTY_FORM = {
  name: '',
  description: '',
  current_price: '',
  stock_quantity: '0',
  category: '',
  image_url: '/images/electronics.svg',
  is_active: true,
};

function validateForm(form) {
  const errors = {};
  if (!form.name.trim() || form.name.trim().length < 2) errors.name = 'Name must be at least 2 characters.';
  if (!form.category.trim() || form.category.trim().length < 2) errors.category = 'Category is required.';
  const price = Number(form.current_price);
  if (form.current_price === '' || !Number.isFinite(price) || price < 0) {
    errors.current_price = 'Enter a valid non-negative price.';
  }
  const stock = Number(form.stock_quantity);
  if (!Number.isInteger(stock) || stock < 0) {
    errors.stock_quantity = 'Stock must be a whole number of zero or more.';
  }
  return errors;
}

export default function AdminProductsPage() {
  const toast = useToast();
  const { categories } = useCategories();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ products: [], pagination: null, loading: true, error: null });
  const [version, setVersion] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category]);

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: null }));
    const params = new URLSearchParams({
      includeInactive: 'true',
      page: String(page),
      limit: '12',
      sort: 'name_asc',
    });
    if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
    if (category !== 'all') params.set('category', category);

    api
      .get(`/products?${params.toString()}`, { signal: controller.signal })
      .then((data) => {
        setState({ products: data.products, pagination: data.pagination, loading: false, error: null });
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setState((current) => ({ ...current, loading: false, error: error.message }));
        }
      });
    return () => controller.abort();
  }, [page, category, debouncedSearch, version]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, category: categories[0]?.name || '', image_url: IMAGE_OPTIONS[0] });
    setFormErrors({});
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description || '',
      current_price: String(product.currentPrice),
      stock_quantity: String(product.stockQuantity),
      category: product.category,
      image_url: product.imageUrl || IMAGE_OPTIONS[0],
      is_active: product.isActive,
    });
    setFormErrors({});
    setFormError('');
    setModalOpen(true);
  };

  const updateField = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');
  };

  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleFileUpload = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB.');
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      const dataUrlPromise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read image file.'));
      });
      reader.readAsDataURL(file);
      const dataUrl = await dataUrlPromise;

      const res = await api.post('/admin/upload', {
        image: dataUrl,
        filename: file.name,
      });

      if (res?.imageUrl) {
        setForm((current) => ({ ...current, image_url: res.imageUrl }));
        setFormErrors((current) => ({ ...current, image_url: undefined }));
        toast.success('Picture uploaded successfully!');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to upload picture.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragOver(false);
  };

  const submitProduct = async (event) => {
    event.preventDefault();
    const errors = validateForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    setFormError('');
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      current_price: Number(form.current_price),
      stock_quantity: Number(form.stock_quantity),
      category: form.category.trim(),
      image_url: form.image_url.trim() || null,
      is_active: form.is_active,
    };

    try {
      if (editing) {
        await api.patch(`/products/${editing.id}`, payload);
        toast.success('Product updated', `${payload.name} was saved.`);
      } else {
        await api.post('/products', payload);
        toast.success('Product created', `${payload.name} is now in the catalogue.`);
      }
      setModalOpen(false);
      setVersion((value) => value + 1);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const requestToggle = (product) => {
    if (product.isActive) {
      setToggleTarget(product);
      return;
    }
    applyToggle(product);
  };

  const applyToggle = async (product) => {
    setToggling(true);
    try {
      const nextActive = !product.isActive;
      await api.patch(`/products/${product.id}`, { is_active: nextActive });
      toast.success(
        nextActive ? 'Product activated' : 'Product deactivated',
        nextActive
          ? `${product.name} is visible in the store again.`
          : `${product.name} was hidden. Historical order records are preserved.`
      );
      setToggleTarget(null);
      setVersion((value) => value + 1);
    } catch (error) {
      toast.error('Could not update product', error.message);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="admin-products-page">
      <div className="admin-section-heading">
        <div>
          <h2>Catalogue</h2>
          <p>Create products, adjust pricing and keep stock accurate. Deactivation preserves history.</p>
        </div>
        <button type="button" className="button button--primary" onClick={openCreate}>
          <PackagePlus size={17} />
          New product
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products by name"
            aria-label="Search products"
          />
          {search ? (
            <button type="button" className="icon-button icon-button--small" onClick={() => setSearch('')} aria-label="Clear search">
              <X size={15} />
            </button>
          ) : null}
        </div>
        <label className="select-field">
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">All categories</option>
            {categories.map((item) => (
              <option value={item.name} key={item.name}>{item.name}</option>
            ))}
          </select>
        </label>
      </div>

      {state.error ? <ErrorPanel message={state.error} onRetry={() => setVersion((value) => value + 1)} /> : null}
      {state.loading ? <PageLoader label="Loading products..." /> : null}

      {!state.loading && !state.error && state.products.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No products found"
          description="Adjust the filters or create a new product."
          action={<button type="button" className="button button--dark" onClick={openCreate}>Create product</button>}
        />
      ) : null}

      {!state.loading && !state.error && state.products.length > 0 ? (
        <div className="panel panel--flush">
          <div className="table-wrap">
            <table className="data-table admin-product-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Category</th>
                  <th scope="col">Price</th>
                  <th scope="col">Stock</th>
                  <th scope="col">Visibility</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.products.map((product) => (
                  <tr key={product.id} className={!product.isActive ? 'row-muted' : undefined}>
                    <td>
                      <div className="table-product">
                        <ProductImage src={product.imageUrl} alt={product.name} />
                        <div>
                          <strong>{product.name}</strong>
                          <span>ID #{product.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>{product.category}</td>
                    <td>{formatCurrency(product.currentPrice)}</td>
                    <td>
                      <span className={`stock-pill${product.stockQuantity === 0 ? ' stock-pill--out' : product.stockQuantity < 5 ? ' stock-pill--low' : ''}`}>
                        {product.stockQuantity}
                      </span>
                    </td>
                    <td>
                      <span className={`visibility-badge${product.isActive ? ' visibility-badge--active' : ''}`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="table-action" onClick={() => openEdit(product)}>
                          <Pencil size={14} />
                          Edit
                        </button>
                        <button
                          type="button"
                          className={`table-action${product.isActive ? ' table-action--danger' : ''}`}
                          onClick={() => requestToggle(product)}
                        >
                          {product.isActive ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                          {product.isActive ? 'Deactivate' : 'Activate'}
                        </button>
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

      <Modal
        open={modalOpen}
        title={editing ? `Edit ${editing.name}` : 'Create product'}
        description={editing ? 'Changes are written directly to PostgreSQL.' : 'Add a new product to the catalogue.'}
        onClose={() => { if (!saving) setModalOpen(false); }}
        size="lg"
        footer={
          <>
            <button type="button" className="button button--secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="product-form" className="button button--primary" disabled={saving}>
              {saving ? <Spinner size="sm" label="Saving" /> : null}
              {saving ? 'Saving...' : editing ? 'Save changes' : 'Create product'}
            </button>
          </>
        }
      >
        <form id="product-form" className="form product-form" onSubmit={submitProduct} noValidate>
          {formError ? <div className="form-alert" role="alert">{formError}</div> : null}

          <div className="form-field">
            <label htmlFor="product-name">Product name</label>
            <input
              id="product-name"
              value={form.name}
              onChange={updateField('name')}
              aria-invalid={Boolean(formErrors.name)}
              placeholder="e.g. Nike Air Max 270"
            />
            {formErrors.name ? <span className="field-error">{formErrors.name}</span> : null}
          </div>

          <div className="form-field">
            <label htmlFor="product-description">Description</label>
            <textarea
              id="product-description"
              rows={3}
              value={form.description}
              onChange={updateField('description')}
              placeholder="Short, useful product description"
            />
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="product-price">Price (PKR)</label>
              <input
                id="product-price"
                type="number"
                min="0"
                step="0.01"
                value={form.current_price}
                onChange={updateField('current_price')}
                aria-invalid={Boolean(formErrors.current_price)}
              />
              {formErrors.current_price ? <span className="field-error">{formErrors.current_price}</span> : null}
            </div>

            <div className="form-field">
              <label htmlFor="product-stock">Stock quantity</label>
              <input
                id="product-stock"
                type="number"
                min="0"
                step="1"
                value={form.stock_quantity}
                onChange={updateField('stock_quantity')}
                aria-invalid={Boolean(formErrors.stock_quantity)}
              />
              {formErrors.stock_quantity ? <span className="field-error">{formErrors.stock_quantity}</span> : null}
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="product-category">Category</label>
            <input
              id="product-category"
              list="category-options"
              value={form.category}
              onChange={updateField('category')}
              aria-invalid={Boolean(formErrors.category)}
              placeholder="Choose or type a category"
            />
            <datalist id="category-options">
              {categories.map((item) => <option value={item.name} key={item.name} />)}
            </datalist>
            {formErrors.category ? <span className="field-error">{formErrors.category}</span> : null}
          </div>

          <div className="form-field form-field--full">
            <label>Product picture</label>
            <div className="image-uploader">
              {/* Dropzone for local file upload */}
              <div
                className={`image-dropzone ${dragOver ? 'image-dropzone--active' : ''} ${uploadingImage ? 'image-dropzone--uploading' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                {uploadingImage ? (
                  <div className="dropzone-status">
                    <Spinner size="md" label="Uploading picture..." />
                    <span>Uploading picture to server...</span>
                  </div>
                ) : (
                  <div className="dropzone-content">
                    <div className="dropzone-icon">
                      <UploadCloud size={24} />
                    </div>
                    <div className="dropzone-text">
                      <strong>Click to upload picture or drag and drop here</strong>
                      <span>Supports JPG, PNG, WEBP, GIF, SVG up to 10MB</span>
                    </div>
                    <button type="button" className="button button--secondary button--small dropzone-btn">
                      <ImagePlus size={15} />
                      Browse computer
                    </button>
                  </div>
                )}
              </div>

              {/* URL input toggle */}
              <div className="image-url-row">
                <button
                  type="button"
                  className="image-url-toggle"
                  onClick={() => setShowUrlInput((v) => !v)}
                >
                  <LinkIcon size={13} />
                  {showUrlInput ? 'Hide URL / preset options' : 'Or use custom image URL / preset'}
                </button>

                {showUrlInput && (
                  <div className="image-url-input-wrap">
                    <input
                      id="product-image"
                      list="image-options"
                      value={form.image_url}
                      onChange={updateField('image_url')}
                      placeholder="/images/electronics.svg or https://..."
                    />
                    <datalist id="image-options">
                      {IMAGE_OPTIONS.map((option) => <option value={option} key={option} />)}
                    </datalist>
                    {form.image_url ? (
                      <button
                        type="button"
                        className="image-clear-btn"
                        onClick={() => updateField('image_url')({ target: { value: '' } })}
                        title="Clear image"
                      >
                        <X size={14} />
                      </button>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Preview */}
              {form.image_url && (
                <div className="product-form__preview">
                  <ProductImage src={form.image_url} alt="Product preview" />
                  <div className="preview-info">
                    <div className="preview-badge">
                      <CheckCircle2 size={13} />
                      Picture selected
                    </div>
                    <code className="preview-url">{form.image_url}</code>
                    <span>This picture will be displayed on the storefront.</span>
                  </div>
                  <button
                    type="button"
                    className="button button--ghost button--small"
                    onClick={() => updateField('image_url')({ target: { value: '' } })}
                    title="Remove picture"
                  >
                    <X size={14} /> Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          <label className="checkbox-field">
            <input type="checkbox" checked={form.is_active} onChange={updateField('is_active')} />
            <span>
              <strong>Visible in storefront</strong>
              <span>Inactive products remain in order history but cannot be purchased.</span>
            </span>
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        title={toggleTarget ? `Deactivate ${toggleTarget.name}?` : ''}
        message="The product will be hidden from the storefront and cannot be added to new orders. Existing orders and historical prices are preserved."
        confirmLabel="Deactivate product"
        tone="danger"
        loading={toggling}
        onConfirm={() => applyToggle(toggleTarget)}
        onCancel={() => setToggleTarget(null)}
      />
    </div>
  );
}
