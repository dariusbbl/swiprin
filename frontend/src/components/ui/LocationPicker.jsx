import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, X } from 'lucide-react';
import styles from './LocationPicker.module.css';

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

function formatSuggestion(item) {
  const a = item.address ?? {};
  const city = a.city || a.town || a.village || a.municipality || a.county;
  const country = a.country;
  if (city && country) return `${city}, ${country}`;
  if (country) return country;
  return item.display_name.split(',').slice(0, 2).join(',').trim();
}

// Classes that are never cities or countries (streets, POIs, buildings…)
const BAD_CLASSES = new Set(['highway', 'amenity', 'shop', 'building', 'tourism',
  'leisure', 'natural', 'waterway', 'railway', 'landuse', 'man_made']);

function isRelevant(item) {
  if (BAD_CLASSES.has(item.class)) return false;
  const a = item.address ?? {};
  if (!a.country) return false; // must belong to a country
  // city / town / village / municipality
  if (item.class === 'place') return true;
  // administrative boundaries cover capitals, regions, countries
  if (item.class === 'boundary' && item.type === 'administrative') return true;
  return false;
}

export default function LocationPicker({ value = '', onChange, placeholder = 'e.g. Bucharest, Romania', className = '' }) {
  const [input, setInput]           = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen]             = useState(false);
  const [loading, setLoading]       = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // sync if parent resets value
  useEffect(() => { setInput(value); }, [value]);

  // close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback(async (q) => {
    if (q.trim().length < 2) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    try {
      const url = `${NOMINATIM}?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=10&accept-language=en`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      const filtered = data.filter(isRelevant);
      // deduplicate by formatted string
      const seen = new Set();
      const unique = filtered.filter(item => {
        const label = formatSuggestion(item);
        if (seen.has(label)) return false;
        seen.add(label);
        return true;
      });
      setSuggestions(unique.slice(0, 6));
      setOpen(unique.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (e) => {
    const q = e.target.value;
    setInput(q);
    onChange(q); // propagate raw text too (user can type freely)
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 350);
  };

  const select = (item) => {
    const label = formatSuggestion(item);
    setInput(label);
    onChange(label);
    setSuggestions([]);
    setOpen(false);
  };

  const clear = () => {
    setInput('');
    onChange('');
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={[styles.wrap, className].join(' ')}>
      <div className={styles.inputWrap}>
        <MapPin size={14} className={styles.icon} />
        <input
          className={[styles.input, 'form-control'].join(' ')}
          value={input}
          onChange={handleInput}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {input && (
          <button type="button" className={styles.clear} onClick={clear} tabIndex={-1}>
            <X size={13} />
          </button>
        )}
      </div>
      {open && (
        <ul className={styles.dropdown}>
          {loading && <li className={styles.hint}>Searching…</li>}
          {!loading && suggestions.map((item, i) => (
            <li key={i} className={styles.option} onMouseDown={() => select(item)}>
              <MapPin size={12} className={styles.optionIcon} />
              {formatSuggestion(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
