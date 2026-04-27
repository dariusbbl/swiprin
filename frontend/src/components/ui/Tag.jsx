import styles from './Tag.module.css';

export default function Tag({ variant = 'default', children, className = '' }) {
  return (
    <span className={[styles.tag, styles[variant], className].join(' ')}>
      {children}
    </span>
  );
}
