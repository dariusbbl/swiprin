import { useState } from 'react';
import { Video, MapPin } from 'lucide-react';
import { scheduleInterview } from '../../api/interviews';
import { updateAppStatus } from '../../api/applications';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import DatePicker from '../ui/DatePicker';
import TimePicker from '../ui/TimePicker';
import styles from './InterviewModal.module.css';

const EMPTY = {
  title: '',
  date: '',
  time: '10:00',
  mode: 'ONLINE',
  location: '',
  description: '',
};

export default function InterviewModal({ open, app, onClose, onDone }) {
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  if (!open || !app) return null;

  const handle = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date) { setError('Please select a date.'); return; }
    setError(''); setSaving(true);
    try {
      const scheduledAt = `${form.date}T${form.time}:00`;
      await updateAppStatus(app.id, 'INTERVIEW');
      await scheduleInterview(app.id, {
        title:       form.title,
        scheduledAt,
        mode:        form.mode,
        location:    form.location || null,
        description: form.description || null,
      });
      setForm(EMPTY);
      onDone();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to schedule interview.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => { setForm(EMPTY); setError(''); onClose(); };

  const candidateName = app.candidate?.fullName ?? 'Candidate';
  const jobTitle      = app.job?.title ?? '';

  return (
    <Modal open={open} onClose={handleClose} title="Schedule">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.hero}>
          <h2 className={styles.heroTitle}>Schedule interview with {candidateName}</h2>
          {jobTitle && <p className={styles.heroSub}>{jobTitle}</p>}
        </div>

        {error && <div className={styles.alert}>{error}</div>}

        <div className={styles.field}>
          <label>Interview title *</label>
          <input name="title" value={form.title} onChange={handle} required
            className="form-control" placeholder="e.g. Technical round – System design" />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label>Date *</label>
            <DatePicker
              value={form.date}
              onChange={(v) => setForm(f => ({ ...f, date: v }))}
              minDate={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className={styles.field}>
            <label>Time</label>
            <TimePicker
              value={form.time}
              onChange={(v) => setForm(f => ({ ...f, time: v }))}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label>Type</label>
          <div className={styles.modeRow}>
            <label className={[styles.modeCard, form.mode === 'ONLINE' ? styles.modeActive : ''].join(' ')}>
              <input type="radio" name="mode" value="ONLINE"
                checked={form.mode === 'ONLINE'} onChange={handle} />
              <Video size={18} />
              <div>
                <span className={styles.modeLabel}>Online</span>
                <span className={styles.modeSub}>Video call</span>
              </div>
            </label>
            <label className={[styles.modeCard, form.mode === 'ONSITE' ? styles.modeActive : ''].join(' ')}>
              <input type="radio" name="mode" value="ONSITE"
                checked={form.mode === 'ONSITE'} onChange={handle} />
              <MapPin size={18} />
              <div>
                <span className={styles.modeLabel}>On-site</span>
                <span className={styles.modeSub}>Set address</span>
              </div>
            </label>
          </div>
        </div>

        {form.mode === 'ONLINE' && (
          <div className={styles.field}>
            <label>Meeting link</label>
            <input name="location" value={form.location} onChange={handle}
              className="form-control" placeholder="https://meet.google.com/…" />
          </div>
        )}

        {form.mode === 'ONSITE' && (
          <div className={styles.field}>
            <label>Address</label>
            <input name="location" value={form.location} onChange={handle}
              className="form-control" placeholder="Office address…" />
          </div>
        )}

        <div className={styles.field}>
          <label>Note to candidate <span className={styles.opt}>(optional)</span></label>
          <textarea name="description" value={form.description} onChange={handle}
            rows={3} className="form-control" style={{ resize: 'vertical' }}
            placeholder="Additional details for the candidate…" />
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" type="button" onClick={handleClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Scheduling…' : 'Schedule & send'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
