import { useState } from 'react';
import Modal from '../ui/Modal';
import RichTextEditor from '../ui/RichTextEditor';
import DatePicker from '../ui/DatePicker';
import Button from '../ui/Button';
import styles from './OfferModal.module.css';

const EMPLOYMENT_TYPES = [
  { value: 'FULL_TIME',  label: 'Full-time' },
  { value: 'PART_TIME',  label: 'Part-time' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'CONTRACT',   label: 'Contract' },
];

const EMPTY = {
  offerText: '',
  salary: '',
  salaryType: 'NET',
  employmentType: 'FULL_TIME',
  deadline: '',
  startDate: '',
};

export default function OfferModal({ open, onClose, onConfirm, loading, app }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!form.deadline) { setError('Please set a response deadline.'); return; }
    if (!form.employmentType) { setError('Please select an employment type.'); return; }
    setError('');
    onConfirm({
      offerText:          form.offerText || null,
      offerSalary:        form.salary ? parseInt(form.salary, 10) : null,
      offerSalaryType:    form.salaryType,
      offerEmploymentType: form.employmentType,
      offerDeadline:      form.deadline,
      offerStartDate:     form.startDate || null,
    });
  };

  const handleClose = () => { setForm(EMPTY); setError(''); onClose(); };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Modal open={open} onClose={handleClose} title="Send job offer" size="md">
      <div className={styles.wrap}>
        {app && (
          <p className={styles.subtitle}>
            Offer to <strong>{app.candidate?.fullName}</strong> for <em>{app.job?.title}</em>
          </p>
        )}

        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className={styles.section}>
          <label className={styles.label}>Offer letter <span className={styles.opt}>(optional)</span></label>
          <RichTextEditor
            value={form.offerText}
            onChange={v => setForm(f => ({ ...f, offerText: v }))}
            placeholder="Describe the offer, role expectations, benefits…"
          />
        </div>

        <div className={styles.row2}>
          <div className={styles.section}>
            <label className={styles.label}>Salary (EUR)</label>
            <div className={styles.salaryRow}>
              <input
                type="number" min={0} className="form-control"
                placeholder="e.g. 3500"
                value={form.salary}
                onChange={e => setForm(f => ({ ...f, salary: e.target.value }))}
              />
              <div className={styles.salaryTypeRow}>
                {['NET', 'GROSS'].map(t => (
                  <label key={t} className={[styles.typeCard, form.salaryType === t ? styles.typeActive : ''].join(' ')}>
                    <input type="radio" checked={form.salaryType === t}
                      onChange={() => setForm(f => ({ ...f, salaryType: t }))} />
                    {t}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <label className={styles.label}>Employment type</label>
            <div className={styles.empRow}>
              {EMPLOYMENT_TYPES.map(et => (
                <label key={et.value}
                  className={[styles.typeCard, form.employmentType === et.value ? styles.typeActive : ''].join(' ')}>
                  <input type="radio" checked={form.employmentType === et.value}
                    onChange={() => setForm(f => ({ ...f, employmentType: et.value }))} />
                  {et.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.row2}>
          <div className={styles.section}>
            <label className={styles.label}>Response deadline *</label>
            <DatePicker
              value={form.deadline}
              onChange={v => setForm(f => ({ ...f, deadline: v }))}
              minDate={today}
            />
            {form.deadline && (
              <span className={styles.deadlineHint}>
                Please respond until {new Date(form.deadline + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            )}
          </div>

          <div className={styles.section}>
            <label className={styles.label}>
              Expected start date <span className={styles.opt}>(optional)</span>
            </label>
            <DatePicker
              value={form.startDate}
              onChange={v => setForm(f => ({ ...f, startDate: v }))}
              minDate={today}
            />
          </div>
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" type="button" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button type="button" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Sending…' : 'Send offer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
