import styles from './EmptyState.module.css';

export default function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.icon}>{icon}</div>
      <h4 className={styles.title}>{title}</h4>
      {description && <p className={styles.desc}>{description}</p>}
      {action}
    </div>
  );
}
