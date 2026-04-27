import styles from './CompanyLogo.module.css';

const GRADIENTS = [
  ['#0ea5e9','#6366f1'], ['#10b981','#0d9488'], ['#f59e0b','#ef4444'],
  ['#8b5cf6','#3b82f6'], ['#ec4899','#f97316'], ['#14b8a6','#22c55e'],
];

function hashStr(s = '') {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default function CompanyLogo({ name = '', size = 44, className = '' }) {
  const [c1, c2] = GRADIENTS[hashStr(name) % GRADIENTS.length];
  const letters = name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  return (
    <div
      className={[styles.logo, className].join(' ')}
      style={{
        width: size, height: size, fontSize: size * .36,
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        borderRadius: size * .22,
      }}
      title={name}
    >
      {letters}
    </div>
  );
}
