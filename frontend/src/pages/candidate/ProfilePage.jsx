import { useState, useEffect } from 'react';
import { getMyProfile, upsertProfile, getFaculties } from '../../api/users';
import { getSkills } from '../../api/jobs';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import styles from './ProfilePage.module.css';

const EDU_LEVELS = [
  { value: 'HIGHSCHOOL', label: 'High School' },
  { value: 'BACHELOR',   label: 'Bachelor' },
  { value: 'MASTER',     label: 'Master' },
  { value: 'PHD',        label: 'PhD' },
  { value: 'BOOTCAMP',   label: 'Bootcamp' },
  { value: 'OTHER',      label: 'Other' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR + 5 - i);

const EMPTY = {
  bio: '', currentLocation: '', educationLevel: '',
  faculty: '', graduationYear: '', linkedInUrl: '', githubUrl: '',
};

export default function ProfilePage() {
  const { user } = useAuth();

  const [form, setForm]         = useState(EMPTY);
  const [faculties, setFaculties] = useState([]);
  const [skills, setSkills]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    Promise.all([
      getMyProfile().catch(() => null),
      getFaculties().catch(() => ({ data: [] })),
      getSkills().catch(() => ({ data: [] })),
    ]).then(([profileRes, facRes, skillsRes]) => {
      if (profileRes?.data) {
        const p = profileRes.data;
        setForm({
          bio:            p.bio ?? '',
          currentLocation: p.currentLocation ?? '',
          educationLevel: p.educationLevel ?? '',
          faculty:        p.faculty ?? '',
          graduationYear: p.graduationYear ? String(p.graduationYear) : '',
          linkedInUrl:    p.linkedInUrl ?? '',
          githubUrl:      p.githubUrl ?? '',
        });
      }
      setFaculties(facRes?.data ?? []);
      setSkills(skillsRes?.data?.content ?? skillsRes?.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const handle = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess(false);
    try {
      const payload = { ...form };
      if (!payload.educationLevel) delete payload.educationLevel;
      payload.graduationYear = payload.graduationYear ? Number(payload.graduationYear) : null;
      await upsertProfile(payload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ color: 'var(--text-3)' }}>Loading…</p>;

  return (
    <div className={styles.page}>
      <div className={styles.avatarRow}>
        <Avatar name={user?.fullName} size={64} />
        <div>
          <h2 className={styles.name}>{user?.fullName}</h2>
          <p className={styles.email}>{user?.email}</p>
        </div>
      </div>

      {error   && <div className={styles.alert}>{error}</div>}
      {success && <div className={styles.successMsg}>Profile saved successfully!</div>}

      <form onSubmit={handleSave} className={styles.form}>
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>About</h3>

          <div className={styles.field}>
            <label>Bio</label>
            <textarea name="bio" value={form.bio} onChange={handle}
              rows={3} className="form-control" placeholder="A few words about yourself…" />
          </div>

          <div className={styles.field}>
            <label>Current location</label>
            <input name="currentLocation" value={form.currentLocation} onChange={handle}
              className="form-control" placeholder="e.g. Bucharest, Romania" />
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Education</h3>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label>Education level</label>
              <select name="educationLevel" value={form.educationLevel}
                onChange={handle} className="form-select">
                <option value="">— Select —</option>
                {EDU_LEVELS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label>Graduation year</label>
              <select name="graduationYear" value={form.graduationYear}
                onChange={handle} className="form-select">
                <option value="">— Select year —</option>
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label>Faculty</label>
            <select name="faculty" value={form.faculty} onChange={handle} className="form-select">
              <option value="">— Select faculty —</option>
              {faculties.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Links</h3>

          <div className={styles.field}>
            <label>LinkedIn URL</label>
            <input name="linkedInUrl" value={form.linkedInUrl} onChange={handle}
              className="form-control" placeholder="https://linkedin.com/in/yourprofile" />
          </div>

          <div className={styles.field}>
            <label>GitHub URL</label>
            <input name="githubUrl" value={form.githubUrl} onChange={handle}
              className="form-control" placeholder="https://github.com/yourusername" />
          </div>
        </section>

        <div className={styles.formActions}>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
        </div>
      </form>
    </div>
  );
}
