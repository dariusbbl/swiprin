import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import styles from './DatePicker.module.css';

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const DOW = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function parseVal(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function toVal(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
function fmtDisplay(str) {
  if (!str) return null;
  return parseVal(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DatePicker({ value, onChange, minDate }) {
  const todayRaw = new Date();
  todayRaw.setHours(0, 0, 0, 0);

  const initial = value ? parseVal(value) : todayRaw;
  const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (value) {
      const d = parseVal(value);
      setView({ year: d.getFullYear(), month: d.getMonth() });
    }
  }, [value]);

  const prev = () => setView(v =>
    v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
  const next = () => setView(v =>
    v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 });

  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const firstDow    = new Date(view.year, view.month, 1).getDay();
  const minDt       = minDate ? parseVal(minDate) : null;

  const isSelected = (d) => {
    if (!value) return false;
    const s = parseVal(value);
    return s.getFullYear() === view.year && s.getMonth() === view.month && s.getDate() === d;
  };
  const isToday = (d) =>
    todayRaw.getFullYear() === view.year && todayRaw.getMonth() === view.month && todayRaw.getDate() === d;
  const isDisabled = (d) => minDt && new Date(view.year, view.month, d) < minDt;

  const select = (d) => { onChange(toVal(view.year, view.month, d)); setOpen(false); };
  const goToday = () => {
    const y = todayRaw.getFullYear(), m = todayRaw.getMonth(), d = todayRaw.getDate();
    setView({ year: y, month: m });
    onChange(toVal(y, m, d));
    setOpen(false);
  };

  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={[styles.trigger, open ? styles.triggerOpen : ''].join(' ')}
        onClick={() => setOpen(o => !o)}
      >
        <CalendarDays size={14} className={styles.ico} />
        <span className={value ? '' : styles.placeholder}>
          {fmtDisplay(value) ?? 'Select date'}
        </span>
      </button>

      {open && (
        <div className={styles.cal}>
          <div className={styles.hdr}>
            <button type="button" className={styles.navBtn} onClick={prev}>
              <ChevronLeft size={14} />
            </button>
            <span className={styles.monthYear}>{MONTHS[view.month]} {view.year}</span>
            <button type="button" className={styles.navBtn} onClick={next}>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className={styles.grid}>
            {DOW.map(d => <span key={d} className={styles.dow}>{d}</span>)}
            {cells.map((day, i) =>
              day === null
                ? <span key={`_${i}`} />
                : (
                  <button
                    key={day}
                    type="button"
                    disabled={isDisabled(day)}
                    className={[
                      styles.day,
                      isSelected(day)                   ? styles.daySelected : '',
                      isToday(day) && !isSelected(day)  ? styles.dayToday    : '',
                      isDisabled(day)                   ? styles.dayOff      : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => select(day)}
                  >
                    {day}
                  </button>
                )
            )}
          </div>

          <div className={styles.ftr}>
            <button type="button" className={styles.ftrBtn}
              onClick={() => { onChange(''); setOpen(false); }}>
              Clear
            </button>
            <button type="button" className={styles.ftrBtn} onClick={goToday}>
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
