import { statusLabel } from '../utils/format.js';

export default function StatusBadge({ status }) {
  return <span className={`status-badge status-badge--${status}`}>{statusLabel(status)}</span>;
}
