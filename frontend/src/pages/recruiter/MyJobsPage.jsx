import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Briefcase } from 'lucide-react';
import { getMyJobs, createJob, updateJob, deleteJob } from '../../api/jobs';
import { getSkills } from '../../api/skills';
import Tag from '../../components/ui/Tag';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import LocationPicker from '../../components/ui/LocationPicker';
import styles from './MyJobsPage.module.css';

const WORK_MODES = ['ON_SITE', 'REMOTE', 'HYBRID'];
const WORK_LABEL = { ON_SITE: 'On-site', REMOTE: 'Remote', HYBRID: 'Hybrid' };
const SENIORITY_OPTS = [
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'JUNIOR',     label: 'Junior' },
  { value: 'MID',        label: 'Mid' },
  { value: 'SENIOR',     label: 'Senior' },
];
const SENIORITY_LABEL = Object.fromEntries(SENIORITY_OPTS.map(o => [o.value, o.label]));

const EMPTY_FORM = { title: '', description: '', location: '', workMode: 'ON_SITE', shortlistThreshold: 70, paid: true, seniority: null, skillIds: [] };

export default function MyJobsPage() {
  const navigate = useNavigate();
  const [data, setData]         = useState(null);
  const [page, setPage]         = useState(0);
  const [search, setSearch]     = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading]   = useState(false);
  const [skills, setSkills]     = useState([]);

  const [formOpen, setFormOpen]       = useState(false);
  const [editing, setEditing]         = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [noThreshold, setNoThreshold] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const [saving, setSaving]           = useState(false);
  const [formError, setFormError]     = useState('');

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyJobs(search ? 0 : page, undefined, search ? 1000 : 10);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { getSkills().then(r => setSkills(r.data?.content ?? r.data ?? [])); }, []);

  const displayed = data?.content?.filter(j =>
    !search ||
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.company?.name?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setNoThreshold(false); setSkillSearch(''); setFormError(''); setFormOpen(true); };
  const openEdit   = (job) => {
    const isNoThreshold = job.shortlistThreshold === 0;
    setEditing(job);
    setNoThreshold(isNoThreshold);
    setForm({
      title: job.title, description: job.description,
      location: job.location ?? '', workMode: job.workMode,
      shortlistThreshold: isNoThreshold ? 70 : job.shortlistThreshold,
      paid: job.paid ?? true,
      seniority: job.seniority ?? null,
      skillIds: job.skills?.map(s => s.id) ?? [],
    });
    setSkillSearch('');
    setFormError('');
    setFormOpen(true);
  };

  const handleField = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const addSkill    = (id) => { setForm(f => ({ ...f, skillIds: f.skillIds.includes(id) ? f.skillIds : [...f.skillIds, id] })); setSkillSearch(''); };
  const removeSkill = (id) => setForm(f => ({ ...f, skillIds: f.skillIds.filter(s => s !== id) }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setFormError('');
    try {
      const payload = {
        ...form,
        shortlistThreshold: noThreshold ? 0 : Number(form.shortlistThreshold),
        skillIds: [...new Set(form.skillIds)],
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
        <button className={styles.searchBtn} onClick={() => { setSearch(searchInput); setPage(0); }}>Search</button>
        {search && (
          <button className={styles.clearBtn} onClick={() => { setSearch(''); setSearchInput(''); }}>✕ Clear</button>
        )}
      </div>

      {loading && <p className={styles.loading}>Loading…</p>}

      {!loading && displayed.length === 0 && (
        <EmptyState icon={<Briefcase size={44} />} title="No jobs found"
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
                  <th>Seniority</th>
                  <th>Pay</th>
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
                      {job.location && <span className={styles.location}><MapPin size={12} /> {job.location}</span>}
                    </td>
                    <td><Tag>{WORK_LABEL[job.workMode]}</Tag></td>
                    <td>
                      {job.seniority
                        ? <Tag>{SENIORITY_LABEL[job.seniority] ?? job.seniority}</Tag>
                        : <span style={{ color: 'var(--text-3)' }}>—</span>}
                    </td>
                    <td>
                      {job.paid != null && (
                        <Tag variant={job.paid ? 'success' : 'default'}>
                          {job.paid ? 'Paid' : 'Unpaid'}
                        </Tag>
                      )}
                    </td>
                    <td>
                      <Tag variant={job.active ? 'success' : 'default'}>
                        {job.active ? 'Active' : 'Closed'}
                      </Tag>
                    </td>
                    <td className={styles.center}>
                      {job.shortlistThreshold === 0 ? <span style={{ color: 'var(--text-3)' }}>All</span> : `${job.shortlistThreshold}%`}
                    </td>
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
              <LocationPicker
                value={form.location}
                onChange={val => setForm(f => ({ ...f, location: val }))}
                placeholder="e.g. Bucharest, Romania"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>Description *</label>
            <textarea name="description" value={form.description} onChange={handleField}
              required rows={8} className="form-control"
              style={{ resize: 'vertical', minHeight: '120px' }}
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
                onChange={handleField} min={1} max={100} className="form-control"
                disabled={noThreshold} />
              <label className={styles.checkRow}>
                <input type="checkbox" checked={noThreshold}
                  onChange={e => setNoThreshold(e.target.checked)} />
                <span>No threshold — show all applicants</span>
              </label>
            </div>
          </div>

          <div className={styles.field}>
            <label>Pay type</label>
            <div className={styles.payRow}>
              <label className={[styles.payCard, form.paid === true ? styles.payActive : ''].join(' ')}>
                <input type="radio" name="paid" value="true"
                  checked={form.paid === true}
                  onChange={() => setForm(f => ({ ...f, paid: true }))} />
                <span className={styles.payLabel}>Paid</span>
              </label>
              <label className={[styles.payCard, form.paid === false ? styles.payUnpaidActive : ''].join(' ')}>
                <input type="radio" name="paid" value="false"
                  checked={form.paid === false}
                  onChange={() => setForm(f => ({ ...f, paid: false }))} />
                <span className={styles.payLabel}>Unpaid</span>
              </label>
            </div>
          </div>

          <div className={styles.field}>
            <label>Seniority level</label>
            <div className={styles.payRow}>
              {SENIORITY_OPTS.map(opt => (
                <label
                  key={opt.value}
                  className={[styles.payCard, form.seniority === opt.value ? styles.senActive : ''].join(' ')}
                >
                  <input type="radio" name="seniority" value={opt.value}
                    checked={form.seniority === opt.value}
                    onChange={() => setForm(f => ({ ...f, seniority: opt.value }))} />
                  <span className={styles.payLabel}>{opt.label}</span>
                </label>
              ))}
            </div>
            {form.seniority && (
              <button type="button" className={styles.clearSeniority}
                onClick={() => setForm(f => ({ ...f, seniority: null }))}>
                Clear selection
              </button>
            )}
          </div>

          <div className={styles.field}>
            <label>Skills</label>

            {form.skillIds.length > 0 && (
              <div className={styles.selectedSkillGrid}>
                {form.skillIds.map(id => {
                  const skill = skills.find(s => s.id === id);
                  if (!skill) return null;
                  return (
                    <button key={id} type="button"
                      className={[styles.skillChip, styles.skillActive].join(' ')}
                      onClick={() => removeSkill(id)} title="Remove">
                      {skill.name} <span className={styles.removeSkill}>×</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className={styles.skillSearchWrap}>
              <input className="form-control" value={skillSearch}
                onChange={e => setSkillSearch(e.target.value)}
                placeholder="Search skills…" />
              {skillSearch.trim() && (() => {
                const q = skillSearch.trim().toLowerCase();
                const suggestions = skills.filter(s => !form.skillIds.includes(s.id) && s.name.toLowerCase().includes(q));
                return suggestions.length > 0 ? (
                  <div className={styles.skillSuggestions}>
                    {suggestions.map(s => (
                      <button key={s.id} type="button" className={styles.skillSuggestion}
                        onClick={() => addSkill(s.id)}>{s.name}</button>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noSkillMatches}>No matching skills.</p>
                );
              })()}
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
