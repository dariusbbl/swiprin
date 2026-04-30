import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyJobs, createJob, updateJob, deleteJob, getSkills } from '../../api/jobs';
import Tag from '../../components/ui/Tag';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import styles from './MyJobsPage.module.css';

const WORK_MODES = ['ON_SITE', 'REMOTE', 'HYBRID'];
const WORK_LABEL = { ON_SITE: 'On-site', REMOTE: 'Remote', HYBRID: 'Hybrid' };
const EMPTY_FORM = { title: '', description: '', location: '', workMode: 'ON_SITE', shortlistThreshold: 70, skillIds: [] };

export default function MyJobsPage() {
  const navigate = useNavigate();
  const [data, setData]         = useState(null);
  const [page, setPage]         = useState(0);
  const [search, setSearch]     = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading]   = useState(false);
  const [skills, setSkills]     = useState([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyJobs(page);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { getSkills().then(r => setSkills(r.data?.content ?? r.data ?? [])); }, []);

  const displayed = data?.content?.filter(j =>
    !search ||
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.company?.name?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(''); setFormOpen(true); };
  const openEdit   = (job) => {
    setEditing(job);
    setForm({
      title: job.title, description: job.description,
      location: job.location ?? '', workMode: job.workMode,
      shortlistThreshold: job.shortlistThreshold,
      skillIds: job.skills?.map(s => s.id) ?? [],
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleField  = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const toggleSkill  = (id) => setForm(f => ({
    ...f,
    skillIds: f.skillIds.includes(id) ? f.skillIds.filter(s => s !== id) : [...f.skillIds, id],
  }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setFormError('');
    try {
      const payload = {
        ...form,
        shortlistThreshold: Number(form.shortlistThreshold),
        skillIds: [...new Set(form.skillIds)],   // array fără duplicate, serializabil în JSON
      };
      if (editing) await updateJob(editing.id, payload);
      else          await createJob(payload);
      setFormOpen(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'Failed to save job.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteJob(deleteId); setDeleteId(null); load(); }
    finally { setDeleting(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>My Jobs</h2>
          <p className={styles.sub}>Manage your job postings</p>
        </div>
        <Button onClick={openCreate}>+ New job</Button>
      </div>

      <div className={styles.searchRow}>
        <input className="form-control" placeholder="Search by title or company…"
          value={searchInput} onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (setSearch(searchInput), setPage(0))} />
        <Button variant="ghost" onClick={() => { setSearch(searchInput); setPage(0); }}>Search</Button>
        {search && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setSearchInput(''); }}>✕ Clear</Button>
        )}
      </div>

      {loading && <p className={styles.loading}>Loading…</p>}

      {!loading && displayed.length === 0 && (
        <EmptyState icon="💼" title="No jobs found"
          description={search ? 'Try a different search term.' : 'Create your first job posting to get started.'}
          action={!search && <Button onClick={openCreate}>+ New job</Button>}
        />
      )}

      {!loading && displayed.length > 0 && (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Work mode</th>
                  <th>Status</th>
                  <th>Threshold</th>
                  <th>Applications</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(job => (
                  <tr key={job.id}>
                    <td className={styles.titleCell}>
                      <span className={styles.jobTitle}>{job.title}</span>
                      {job.location && <span className={styles.location}>📍 {job.location}</span>}
                    </td>
                    <td><Tag>{WORK_LABEL[job.workMode]}</Tag></td>
                    <td>
                      <Tag variant={job.active ? 'success' : 'default'}>
                        {job.active ? 'Active' : 'Closed'}
                      </Tag>
                    </td>
                    <td className={styles.center}>{job.shortlistThreshold}%</td>
                    <td className={styles.center}>
                      <button className={styles.appLink}
                        onClick={() => navigate(`/recruiter/jobs/${job.id}/applicants`)}>
                        {job.applicationCount} →
                      </button>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(job)}>Edit</Button>
                        <Button size="sm" variant="danger-soft" onClick={() => setDeleteId(job.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}

      {/* Create / Edit modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)}
        title={editing ? 'Edit job' : 'Create new job'} size="lg">
        <form onSubmit={handleSave} className={styles.form}>
          {formError && <div className={styles.formError}>{formError}</div>}

          <div className={styles.row2}>
            <div className={styles.field}>
              <label>Title *</label>
              <input name="title" value={form.title} onChange={handleField}
                required className="form-control" placeholder="e.g. Backend Engineer" />
            </div>
            <div className={styles.field}>
              <label>Location</label>
              <input name="location" value={form.location} onChange={handleField}
                className="form-control" placeholder="e.g. Bucharest" />
            </div>
          </div>

          <div className={styles.field}>
            <label>Description *</label>
            <textarea name="description" value={form.description} onChange={handleField}
              required rows={4} className="form-control"
              placeholder="Describe the role, requirements and responsibilities…" />
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label>Work mode</label>
              <select name="workMode" value={form.workMode} onChange={handleField} className="form-select">
                {WORK_MODES.map(m => <option key={m} value={m}>{WORK_LABEL[m]}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Shortlist threshold (%)</label>
              <input type="number" name="shortlistThreshold" value={form.shortlistThreshold}
                onChange={handleField} min={0} max={100} className="form-control" />
            </div>
          </div>

          <div className={styles.field}>
            <label>Skills</label>
            <div className={styles.skillGrid}>
              {skills.map(s => (
                <label key={s.id} className={[styles.skillChip, form.skillIds.includes(s.id) ? styles.skillActive : ''].join(' ')}>
                  <input type="checkbox" checked={form.skillIds.includes(s.id)}
                    onChange={() => toggleSkill(s.id)} style={{ display: 'none' }} />
                  {s.name}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.formActions}>
            <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create job'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete job?"
        message="This will permanently delete the job and all its applications. This action cannot be undone."
      />
    </div>
  );
}
