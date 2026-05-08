import { useState, useEffect } from 'react';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';
import styles from './TimePicker.module.css';

const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')); // 00-23
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')); // 00-59

function parse(hhmm) {
  if (!hhmm || !hhmm.includes(':')) return { hIdx: 10, mIdx: 0 }; // default 10:00
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  return {
    hIdx: isNaN(h) || h < 0 || h > 23 ? 10 : h,
    mIdx: isNaN(m) || m < 0 || m > 59 ? 0  : m,
  };
}

function to24(hIdx, mIdx) {
  return `${HOURS[hIdx]}:${MINUTES[mIdx]}`;
}

function fmtDisplay(hhmm) {
  const { hIdx, mIdx } = parse(hhmm);
  return `${HOURS[hIdx]}:${MINUTES[mIdx]}`;
}

function Col({ items, idx, onIdx }) {
  const len  = items.length;
  const prev = (idx - 1 + len) % len;
  const next = (idx + 1) % len;
  return (
    <div className={styles.col}>
      <button type="button" className={styles.colBtn} onClick={() => onIdx(prev)}>
        <ChevronUp size={13} />
      </button>
      <div className={styles.track}>
        <div className={styles.other} onClick={() => onIdx(prev)}>{items[prev]}</div>
        <div className={styles.sel}>{items[idx]}</div>
        <div className={styles.other} onClick={() => onIdx(next)}>{items[next]}</div>
      </div>
      <button type="button" className={styles.colBtn} onClick={() => onIdx(next)}>
        <ChevronDown size={13} />
      </button>
    </div>
  );
}

export default function TimePicker({ value, onChange }) {
  const init = parse(value);
  const [hIdx, setHIdx] = useState(init.hIdx);
  const [mIdx, setMIdx] = useState(init.mIdx);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const { hIdx: h, mIdx: m } = parse(value);
    setHIdx(h);
    setMIdx(m);
  }, [value]);

  const handleH = (i) => { setHIdx(i); onChange(to24(i,    mIdx)); };
  const handleM = (i) => { setMIdx(i); onChange(to24(hIdx, i));    };

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={[styles.trigger, open ? styles.triggerOpen : ''].join(' ')}
        onClick={() => setOpen(o => !o)}
      >
        <Clock size={14} className={styles.ico} />
        <span>{fmtDisplay(value)}</span>
      </button>

      {open && (
        <div className={styles.picker}>
          <div className={styles.cols}>
            <Col items={HOURS}   idx={hIdx} onIdx={handleH} />
            <span className={styles.sep}>:</span>
            <Col items={MINUTES} idx={mIdx} onIdx={handleM} />
          </div>
        </div>
      )}
    </div>
  );
}
