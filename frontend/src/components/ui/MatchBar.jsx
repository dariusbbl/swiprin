// Recruiter-only component — never render in candidate views
import styles from './MatchBar.module.css';

export default function MatchBar({ value = 0, showLabel = true, className = '' }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warn)' : 'var(--danger)';

  return (
    <div className={[styles.wrap, className].join(' ')}>
      {showLabel && (
        <span className={styles.label} style={{ color }}>{pct}% match</span>
      )}
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
