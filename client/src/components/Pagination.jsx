import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="pagination__summary">
        Page {pagination.page} of {pagination.totalPages} · {pagination.total} results
      </span>
      <div className="pagination__controls">
        <button
          type="button"
          className="button button--secondary button--small"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={!pagination.hasPreviousPage}
        >
          <ChevronLeft size={16} />
          Previous
        </button>
        <button
          type="button"
          className="button button--secondary button--small"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={!pagination.hasNextPage}
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
