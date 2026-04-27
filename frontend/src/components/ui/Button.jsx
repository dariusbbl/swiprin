import styles from './Button.module.css';

const sizeClass = { sm: styles.sm, lg: styles.lg, icon: styles.icon };

export default function Button({
  variant = 'primary',
  size,
  children,
  className = '',
  ...props
}) {
  return (
    <button
      className={[styles.btn, styles[variant], sizeClass[size] ?? '', className].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
