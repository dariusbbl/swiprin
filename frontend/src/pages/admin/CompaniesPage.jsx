import { useState, useEffect, useCallback } from 'react';
import { Building2 } from 'lucide-react';
import { getCompanies, createCompany, updateCompany, verifyCompany, deleteCompany } from '../../api/companies';
import Tag from '../../components/ui/Tag';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import CompanyLogo from '../../components/ui/CompanyLogo';
import styles from './CompaniesPage.module.css';

const EMPTY_FORM = { name: '', website: '', description: '', logoUrl: '' };

function fmt(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CompaniesPage() {
  const [data, setData]           = useState(null);
  const [page, setPage]           = useState(0);
  const [nameInput, setNameInput] = useState('');
  const [name, setName]           = useState('');
  const [loading, setLoading]     = useState(false);

  const [formOpen, setFormOpen]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCompanies(name ? 0 : page, name ? 1000 : 10);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [page, name]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(''); setFormOpen(true); };
  const openEdit   = (c) => {
    setEditing(c);
    setForm({ name: c.name, website: c.website ?? '', description: c.description ?? '', logoUrl: c.logoUrl ?? '' });
    setFormError('');
    setFormOpen(true);
  };

  const handleField = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setFormError('');
    try {
      if (editing) await updateCompany(editing.id, form);
      else          await createCompany(form);
      setFormOpen(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'Failed to save company.');
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async (id) => { await verifyCompany(id); load(); };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteCompany(deleteId); setDeleteId(null); load(); }
    finally { setDeleting(false); }
  };

  const displayed = (data?.content ?? []).filter(c =>
    !name || c.name?.toLowerCase().includes(name.toLowerCase())
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Companies</h2>
          <p className={styles.sub}>Manage registered companies</p>
        </div>
        <Button onClick={openCreate}>+ New company</Button>
      </div>

      <div className={styles.searchRow}>
        <input className="form-control" placeholder="Search by name…"
          value={nameInput} onChange={e => setNameInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (setName(nameInput), setPage(0))} />
        <button className={styles.searchBtn} onClick={() => { setName(nameInput); setPage(0); }}>Search</button>
        {name && (
          <button className={styles.clearBtn} onClick={() => { setName(''); setNameInput(''); }}>✕ Clear</button>
        )}
      </div>

      {loading && <p className={styles.loading}>Loading…</p>}

      {!loading && displayed.length === 0 && (
        <EmptyState icon={<Building2 size={44} />} title="No companies"
          description={name ? 'No companies match this name.' : 'No companies registered yet.'}
          action={!name && <Button onClick={openCreate}>+ New company</Button>} />
      )}

      {!loading && displayed.length > 0 && (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.center}>ID</th>
                  <th>Company</th>
                  <th>Website</th>
                  <th>Verified</th>
                  <th>Jobs</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(c => (
                  <tr key={c.id}>
                    <td className={styles.center}>
                      <span className={styles.idBadge}>{c.id}</span>
                    </td>
                    <td>
                      <div className={styles.companyCell}>
                        <CompanyLogo name={c.name} size={32} />
                        <span className={styles.name}>{c.name}</span>
                      </div>
                    </td>
                    <td>
                      {c.website
                        ? <a href={c.website} target="_blank" rel="noreferrer" className={styles.link}>{c.website}</a>
                        : <span className={styles.muted}>—</span>}
                    </td>
                    <td>
                      <Tag variant={c.isVerified ? 'success' : 'warn'}>
                        {c.isVerified ? 'Verified' : 'Unverified'}
                      </Tag>
                    </td>
                    <td className={styles.center}>{c.jobCount}</td>
                    <td className={styles.date}>{fmt(c.createdAt)}</td>
                    <td>
                      <div className={styles.actions}>
                        {!c.isVerified && (
                          <Button size="sm" variant="success-soft" onClick={() => handleVerify(c.id)}>
                            Verify
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>Edit</Button>
                        <Button size="sm" variant="danger-soft" onClick={() => setDeleteId(c.id)}>Delete</Button>
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

      <Modal open={formOpen} onClose={() => setFormOpen(false)}
        title={editing ? 'Edit company' : 'New company'} size="md">
        <form onSubmit={handleSave} className={styles.form}>
          {formError && <div className={styles.formError}>{formError}</div>}
          <div className={styles.field}>
            <label>Name *</label>
            <input name="name" value={form.name} onChange={handleField}
              required className="form-control" placeholder="Acme Corp" />
          </div>
          <div className={styles.field}>
            <label>Website</label>
            <input name="website" value={form.website} onChange={handleField}
              className="form-control" placeholder="https://acme.com" />
          </div>
          <div className={styles.field}>
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleField}
              rows={3} className="form-control" placeholder="Short company description…" />
          </div>
          <div className={styles.field}>
            <label>Logo URL</label>
            <input name="logoUrl" value={form.logoUrl} onChange={handleField}
              className="form-control" placeholder="https://…/logo.png" />
          </div>
          <div className={styles.formActions}>
            <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete company?"
        message="This will permanently delete the company. This action cannot be undone."
      />
    </div>
  );
}
