import { useState } from 'react';
import { submitTicket } from '../../api/tickets';
import styles from './FeedbackPage.module.css';

const CATEGORIES = [
  { value: 'BUG_REPORT',      label: '🐛 Bug report' },
  { value: 'FEATURE_REQUEST', label: '💡 Feature request' },
  { value: 'ACCOUNT_ISSUE',   label: '🔐 Account issue' },
  { value: 'OTHER',           label: '💬 Other' },
];

const PRIORITIES = [
  { value: 'LOW',    label: 'Low',    desc: 'Minor issue, not urgent' },
  { value: 'MEDIUM', label: 'Medium', desc: 'Affects my workflow' },
  { value: 'HIGH',   label: 'High',   desc: 'Blocks me entirely' },
];

export default function FeedbackPage() {
  const [form, setForm] = useState({
    category: '', priority: 'LOW', message: '', contactConsent: false,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.category) { setError('Please select a category.'); return; }
    if (form.message.trim().length < 10) { setError('Message must be at least 10 characters.'); return; }
    setError(''); setLoading(true);
    try {
      await submitTicket({ ...form, message: form.message.trim() });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>✅</div>
          <h2>Ticket submitted!</h2>
          <p>Our team will review your feedback. Thank you for helping us improve Swiprin.</p>
          <button className="btn btn-primary" onClick={() => {
            setSuccess(false);
            setForm({ category: '', priority: 'LOW', message: '', contactConsent: false });
          }}>Submit another</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h2 className={styles.title}>Support & Feedback</h2>
        <p className={styles.sub}>Found a bug or have a suggestion? Let us know — our team reviews every ticket.</p>

        {error && <div className={styles.alert}>{error}</div>}

        <form onSubmit={submit} className={styles.form}>
          {/* SELECT */}
          <div className={styles.field}>
            <label htmlFor="category">Category *</label>
            <select id="category" name="category" value={form.category}
              onChange={handle} className="form-select" required>
              <option value="">— Select a category —</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* RADIO */}
          <div className={styles.field}>
            <label>Priority *</label>
            <div className={styles.radioGroup}>
              {PRIORITIES.map(p => (
                <label key={p.value}
                  className={[styles.radioCard, form.priority === p.value ? styles.radioActive : ''].join(' ')}>
                  <input type="radio" name="priority" value={p.value}
                    checked={form.priority === p.value} onChange={handle} />
                  <div>
                    <span className={styles.radioLabel}>{p.label}</span>
                    <span className={styles.radioDesc}>{p.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* TEXTAREA */}
          <div className={styles.field}>
            <label htmlFor="message">
              Message * <span className={styles.charHint}>({form.message.length}/2000)</span>
            </label>
            <textarea id="message" name="message" value={form.message} onChange={handle}
              rows={5} maxLength={2000} required className="form-control"
              placeholder="Describe the issue or suggestion in detail…" />
          </div>

          {/* CHECKBOX */}
          <label className={styles.checkboxRow}>
            <input type="checkbox" name="contactConsent" checked={form.contactConsent} onChange={handle} />
            <span>I allow the Swiprin team to use my account details to investigate this ticket</span>
          </label>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit ticket'}
          </button>
        </form>
      </div>
    </div>
  );
}
