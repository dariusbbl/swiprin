import styles from './Pagination.module.css';

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 0; i < totalPages; i++) {
    if (
      i === 0 || i === totalPages - 1 ||
      Math.abs(i - page) <= 1
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className={styles.wrap}>
      <button className={styles.btn} disabled={page === 0} onClick={() => onChange(page - 1)}>
        ‹
      </button>

      {pages.map((p, idx) =>
        p === '...' ? (
          <span key={`e${idx}`} className={styles.ellipsis}>…</span>
        ) : (
          <button
            key={p}
            className={[styles.btn, p === page ? styles.active : ''].join(' ')}
            onClick={() => onChange(p)}
          >
            {p + 1}
          </button>
        )
      )}

      <button className={styles.btn} disabled={page === totalPages - 1} onClick={() => onChange(page + 1)}>
        ›
      </button>
    </div>
  );
}
