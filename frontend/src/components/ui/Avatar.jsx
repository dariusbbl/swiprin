import styles from './Avatar.module.css';

const GRADIENTS = [
  ['#6366f1','#8b5cf6'], ['#3b82f6','#06b6d4'], ['#10b981','#34d399'],
  ['#f59e0b','#f97316'], ['#ef4444','#f43f5e'], ['#8b5cf6','#ec4899'],
];

function hashStr(s = '') {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
}

export default function Avatar({ name = '', size = 36, className = '' }) {
  const [c1, c2] = GRADIENTS[hashStr(name) % GRADIENTS.length];
  return (
    <div
      className={[styles.avatar, className].join(' ')}
      style={{
        width: size, height: size, fontSize: size * .38,
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
      }}
      title={name}
    >
      {initials(name)}
    </div>
  );
}
