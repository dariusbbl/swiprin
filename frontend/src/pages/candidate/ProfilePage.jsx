import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { getMyProfile, upsertProfile, getFaculties } from '../../api/users';
import { getCvDrafts, createCvDraft, updateCvDraft, uploadCvFile, setDefaultCv, deleteCvDraft } from '../../api/cvDrafts';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import ConfirmModal from '../../components/ui/ConfirmModal';
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

const EMPTY_PROFILE = {
  bio: '', currentLocation: '', educationLevel: '',
  faculty: '', graduationYear: '', linkedInUrl: '', githubUrl: '',
};
const EMPTY_CV = { name: '', isDefault: false };

export default function ProfilePage() {
  const { user } = useAuth();

  const [form, setForm]           = useState(EMPTY_PROFILE);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState('');

  const [cvDrafts, setCvDrafts]     = useState([]);
  const [cvForm, setCvForm]         = useState(EMPTY_CV);
  const [cvFile, setCvFile]         = useState(null);   // selected File object
  const [editingCv, setEditingCv]   = useState(null);
  const [cvFormOpen, setCvFormOpen] = useState(false);
  const [cvSaving, setCvSaving]     = useState(false);
  const [cvError, setCvError]       = useState('');
  const [deleteId, setDeleteId]     = useState(null);
  const [deleting, setDeleting]     = useState(false);

  useEffect(() => {
    Promise.all([
      getMyProfile().catch(() => null),
      getFaculties().catch(() => ({ data: [] })),
      getCvDrafts().catch(() => ({ data: [] })),
    ]).then(([profileRes, facRes, cvRes]) => {
      if (profileRes?.data) {
        const p = profileRes.data;
        setForm({
          bio:             p.bio ?? '',
          currentLocation: p.currentLocation ?? '',
          educationLevel:  p.educationLevel ?? '',
          faculty:         p.faculty ?? '',
          graduationYear:  p.graduationYear ? String(p.graduationYear) : '',
          linkedInUrl:     p.linkedInUrl ?? '',
          githubUrl:       p.githubUrl ?? '',
        });
      }
      setFaculties(facRes?.data ?? []);
      setCvDrafts(cvRes?.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const loadCvs = () => getCvDrafts().then(r => setCvDrafts(r.data ?? []));

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
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

  const openCreateCv = () => {
    setEditingCv(null); setCvForm(EMPTY_CV); setCvFile(null); setCvError(''); setCvFormOpen(true);
  };
  const openEditCv = (cv) => {
    setEditingCv(cv);
    setCvForm({ name: cv.name, isDefault: cv.isDefault ?? false });
    setCvFile(null); setCvError(''); setCvFormOpen(true);
  };

  const handleCvSave = async (e) => {
    e.preventDefault();
    if (!editingCv && !cvFile) { setCvError('Please select a CV file.'); return; }
    setCvSaving(true); setCvError('');
    try {
      let draft;
      if (editingCv) {
        draft = (await updateCvDraft(editingCv.id, cvForm)).data;
      } else {
        draft = (await createCvDraft(cvForm)).data;
      }
      if (cvFile) {
        await uploadCvFile(draft.id, cvFile);
      }
      setCvFormOpen(false);
      loadCvs();
    } catch (err) {
      setCvError(err.response?.data?.message ?? 'Failed to save CV.');
    } finally {
      setCvSaving(false);
    }
  };

  const handleSetDefault = async (id) => { await setDefaultCv(id); loadCvs(); };

  const handleDeleteCv = async () => {
    setDeleting(true);
    try { await deleteCvDraft(deleteId); setDeleteId(null); loadCvs(); }
    finally { setDeleting(false); }
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

      {/* About + My CVs side by side */}
      <div className={styles.topRow}>

        {/* About — left */}
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

        {/* My CVs — right */}
        <section className={styles.section}>
          <div className={styles.cvHeader}>
            <h3 className={styles.sectionTitle} style={{ margin: 0, border: 'none', paddingBottom: 0 }}>
              My CVs
            </h3>
            <Button size="sm" onClick={openCreateCv}>+ Add CV</Button>
          </div>

          {cvDrafts.length === 0 && !cvFormOpen && (
            <p className={styles.cvEmpty}>No CVs yet. Add one to apply to jobs.</p>
          )}

          {cvDrafts.map(cv => (
            <div key={cv.id} className={styles.cvRow}>
              <div className={styles.cvInfo}>
                <span className={styles.cvName}>{cv.name}</span>
                {cv.isDefault && <span className={styles.cvDefault}>default</span>}
                {cv.fileUrl && (
                  <a href={cv.fileUrl} target="_blank" rel="noreferrer" className={styles.cvLink}>
                    <FileText size={13} /> View ↗
                  </a>
                )}
                {!cv.fileUrl && (
                  <span className={styles.noFile}>no file</span>
                )}
              </div>
              <div className={styles.cvActions}>
                {!cv.isDefault && (
                  <Button size="sm" variant="ghost" onClick={() => handleSetDefault(cv.id)}>
                    Set default
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => openEditCv(cv)}>Edit</Button>
                <Button size="sm" variant="danger-soft" onClick={() => setDeleteId(cv.id)}>Delete</Button>
              </div>
            </div>
          ))}

          {cvFormOpen && (
            <form onSubmit={handleCvSave} className={styles.cvForm}>
              {cvError && <div className={styles.alert}>{cvError}</div>}
              <div className={styles.field}>
                <label>Name *</label>
                <input value={cvForm.name}
                  onChange={e => setCvForm(f => ({ ...f, name: e.target.value }))}
                  required maxLength={40} className="form-control"
                  placeholder="e.g. Software Engineer CV" />
              </div>
              <div className={styles.field}>
                <label>
                  CV file {editingCv ? '(leave empty to keep existing)' : '*'}
                </label>
                <input type="file" accept=".pdf,.doc,.docx"
                  className="form-control"
                  onChange={e => setCvFile(e.target.files?.[0] ?? null)} />
                {editingCv?.fileUrl && !cvFile && (
                  <span className={styles.existingFile}>
                    Current: <a href={editingCv.fileUrl} target="_blank" rel="noreferrer">view file ↗</a>
                  </span>
                )}
              </div>
              <label className={styles.checkboxRow}>
                <input type="checkbox" checked={cvForm.isDefault}
                  onChange={e => setCvForm(f => ({ ...f, isDefault: e.target.checked }))} />
                <span>Set as default CV</span>
              </label>
              <div className={styles.cvFormActions}>
                <Button variant="ghost" type="button" onClick={() => setCvFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={cvSaving}>
                  {cvSaving ? 'Saving…' : editingCv ? 'Save changes' : 'Add CV'}
                </Button>
              </div>
            </form>
          )}
        </section>
      </div>

      {/* Education — full width */}
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
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div className={styles.field}>
          <label>Faculty</label>
          <select name="faculty" value={form.faculty} onChange={handle} className="form-select">
            <option value="">— Select faculty —</option>
            {faculties.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </section>

      {/* Links — full width */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Links</h3>
        <div className={styles.row2}>
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
        </div>
      </section>

      <div className={styles.formActions}>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </Button>
      </div>

      <ConfirmModal
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteCv} loading={deleting}
        title="Delete CV?"
        message="This will remove the CV draft. Applications already submitted will not be affected."
      />
    </div>
  );
}
