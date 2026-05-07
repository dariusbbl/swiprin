import { useState, useEffect } from 'react';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';
import styles from './TimePicker.module.css';

const HOURS   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const AMPMS   = ['AM', 'PM'];

function parse24(hhmm) {
  const fallback = { hIdx: 9, mIdx: 0, apIdx: 0 }; // 10:00 AM
  if (!hhmm || !hhmm.includes(':')) return fallback;
  const [hStr, mStr] = hhmm.split(':');
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return fallback;
  const apIdx = h < 12 ? 0 : 1;
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  const hIdx = HOURS.indexOf(String(h).padStart(2, '0'));
  const mIdx = MINUTES.indexOf((mStr ?? '00').slice(0, 2).padStart(2, '0'));
  return { hIdx: hIdx < 0 ? 0 : hIdx, mIdx: mIdx < 0 ? 0 : mIdx, apIdx };
}

function to24(hIdx, mIdx, apIdx) {
  let h = parseInt(HOURS[hIdx], 10);
  if (apIdx === 0) { if (h === 12) h = 0; }
  else             { if (h !== 12) h += 12; }
  return `${String(h).padStart(2, '0')}:${MINUTES[mIdx]}`;
}

function fmtDisplay(hhmm) {
  const { hIdx, mIdx, apIdx } = parse24(hhmm);
  return `${HOURS[hIdx]}:${MINUTES[mIdx]} ${AMPMS[apIdx]}`;
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
  const init = parse24(value);
  const [hIdx,  setHIdx]  = useState(init.hIdx);
  const [mIdx,  setMIdx]  = useState(init.mIdx);
  const [apIdx, setApIdx] = useState(init.apIdx);
  const [open,  setOpen]  = useState(false);

  useEffect(() => {
    const { hIdx: h, mIdx: m, apIdx: a } = parse24(value);
    setHIdx(h); setMIdx(m); setApIdx(a);
  }, [value]);

  const handleH  = (i) => { setHIdx(i);  onChange(to24(i,    mIdx, apIdx)); };
  const handleM  = (i) => { setMIdx(i);  onChange(to24(hIdx, i,    apIdx)); };
  const handleAP = (i) => { setApIdx(i); onChange(to24(hIdx, mIdx, i));    };

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
            <Col items={HOURS}   idx={hIdx}  onIdx={handleH}  />
            <span className={styles.sep}>:</span>
            <Col items={MINUTES} idx={mIdx}  onIdx={handleM}  />
            <span className={styles.spacer} />
            <Col items={AMPMS}   idx={apIdx} onIdx={handleAP} />
          </div>
        </div>
      )}
    </div>
  );
}
