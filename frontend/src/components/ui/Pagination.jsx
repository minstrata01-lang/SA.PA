// frontend/src/components/ui/Pagination.jsx

const blue   = "#003D6B";

function buildPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  if (current <= 4) {
    // show 1..5 + ellipsis + last; only add ellipsis if it hides ≥3 pages
    const showEnd = 5;
    pages.push(1, 2, 3, 4, 5);
    if (total - showEnd > 3) pages.push('...');
    pages.push(total);
  } else if (current >= total - 3) {
    // show first + ellipsis + last 5
    const showStart = total - 4;
    pages.push(1);
    if (showStart - 1 > 3) pages.push('...');
    pages.push(total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total);
  }
  return pages;
}

const btnBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 36,
  minWidth: 36,
  borderRadius: 999,
  border: `1px solid rgba(0,61,107,0.15)`,
  background: 'white',
  fontFamily: "'Manrope', sans-serif",
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.18s ease',
  padding: '0 10px',
};

export default function Pagination({ totalCount, pageSize, currentPage, onPageChange }) {
  const totalPages = Math.ceil(totalCount / pageSize);
  if (totalPages <= 1) return null;

  const pages = buildPageRange(currentPage, totalPages);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 40 }}>
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          ...btnBase,
          color: currentPage === 1 ? 'rgba(0,61,107,0.25)' : blue,
          cursor: currentPage === 1 ? 'default' : 'pointer',
          borderColor: currentPage === 1 ? 'rgba(0,61,107,0.08)' : 'rgba(0,61,107,0.15)',
        }}
        aria-label="Halaman sebelumnya"
      >
        ←
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} style={{ color: 'rgba(0,61,107,0.35)', fontFamily: "'Manrope', sans-serif", fontSize: 13, padding: '0 4px' }}>
            …
          </span>
        ) : (
          <button
            key={`page-${p}`}
            type="button"
            onClick={() => onPageChange(p)}
            style={{
              ...btnBase,
              background: p === currentPage ? blue : 'white',
              color:      p === currentPage ? 'white' : blue,
              borderColor: p === currentPage ? blue : 'rgba(0,61,107,0.15)',
            }}
            aria-label={`Halaman ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          ...btnBase,
          color: currentPage === totalPages ? 'rgba(0,61,107,0.25)' : blue,
          cursor: currentPage === totalPages ? 'default' : 'pointer',
          borderColor: currentPage === totalPages ? 'rgba(0,61,107,0.08)' : 'rgba(0,61,107,0.15)',
        }}
        aria-label="Halaman berikutnya"
      >
        →
      </button>
    </div>
  );
}
