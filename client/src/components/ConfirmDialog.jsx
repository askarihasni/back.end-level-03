import { AlertTriangle } from 'lucide-react';
import Modal from './Modal.jsx';
import { Spinner } from './Feedback.jsx';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
  children,
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={loading ? () => {} : onCancel}
      size="sm"
      footer={
        <>
          <button type="button" className="button button--secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`button ${tone === 'danger' ? 'button--danger' : 'button--primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Spinner size="sm" label="Working" /> : null}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className={`confirm-dialog confirm-dialog--${tone}`}>
        <AlertTriangle size={22} aria-hidden="true" />
        <div>
          <p>{message}</p>
          {children}
        </div>
      </div>
    </Modal>
  );
}
