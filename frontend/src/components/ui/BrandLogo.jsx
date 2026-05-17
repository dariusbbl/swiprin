import styles from './BrandLogo.module.css';

export default function BrandLogo() {
  return (
    <div className={styles.brand}>
      <div className={styles.icon}>S</div>
      <span className={styles.text}>wiprin</span>
    </div>
  );
}
