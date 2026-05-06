import { useState, useEffect, useCallback } from 'react';
import { Users } from 'lucide-react';
import { getUsers, setUserStatus, deleteUser } from '../../api/users';
import Tag from '../../components/ui/Tag';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import styles from './UsersPage.module.css';

const ROLES    = ['', 'CANDIDATE', 'RECRUITER', 'ADMIN'];
const STATUS_VARIANT = { ACTIVE: 'success', PENDING_APPROVAL: 'warn', REJECTED: 'danger' };
const STATUS_LABEL   = { ACTIVE: 'Active', PENDING_APPROVAL: 'Pending', REJECTED: 'Rejected' };

function fmt(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function UsersPage() {
  const [data, setData]           = useState(null);
  const [page, setPage]           = useState(0);
  const [role, setRole]           = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [companyInput,  setCompanyInput]  = useState('');
  const [loading, setLoading]     = useState(false);
  const [deleteId, setDeleteId]   = useState(null);
  const [deleting, setDeleting]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers(page, role || undefined, companySearch || undefined);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [page, role, companySearch]);

  useEffect(() => { load(); }, [load]);

  const handleRole = (val) => {
    setRole(val);
    setPage(0);
    if (val !== 'RECRUITER') { setCompanySearch(''); setCompanyInput(''); }
  };

  const applyCompanySearch = () => { setCompanySearch(companyInput); setPage(0); };
  const clearCompanySearch = () => { setCompanySearch(''); setCompanyInput(''); setPage(0); };

  const handleStatus = async (id, status) => {
    await setUserStatus(id, status);
    load();
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteUser(deleteId); setDeleteId(null); load(); }
    finally { setDeleting(false); }
  };

  const users = data?.content ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Users</h2>
          <p className={styles.sub}>Manage all platform users</p>
        </div>
        <select className="form-select" style={{ width: 'auto' }}
          value={role} onChange={e => handleRole(e.target.value)}>
          <option value="">All roles</option>
          {ROLES.filter(r => r).map(r => (
            <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
          ))}
        </select>
      </div>

      {role === 'RECRUITER' && (
        <div className={styles.companyBar}>
          <input
            className="form-control"
            placeholder="Search by company name…"
            value={companyInput}
            onChange={e => setCompanyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyCompanySearch()}
            style={{ maxWidth: 280 }}
          />
          <Button variant="ghost" onClick={applyCompanySearch}>Search</Button>
          {companySearch && (
            <Button variant="ghost" size="sm" onClick={clearCompanySearch}>Clear</Button>
          )}
        </div>
      )}

      {loading && <p className={styles.loading}>Loading…</p>}

      {!loading && users.length === 0 && (
        <EmptyState icon={<Users size={44} />} title="No users" description="No users match the selected filter." />
      )}

      {!loading && users.length > 0 && (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Company</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className={styles.userCell}>
                        <Avatar name={u.fullName} size={32} />
                        <div>
                          <div className={styles.name}>{u.fullName}</div>
                          <div className={styles.email}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><Tag>{u.role}</Tag></td>
                    <td>
                      <Tag variant={STATUS_VARIANT[u.status] ?? 'default'}>
                        {STATUS_LABEL[u.status] ?? u.status}
                      </Tag>
                    </td>
                    <td>{u.company?.name ?? <span className={styles.muted}>—</span>}</td>
                    <td className={styles.date}>{fmt(u.createdAt)}</td>
                    <td>
                      <div className={styles.actions}>
                        {u.status !== 'ACTIVE' && (
                          <Button size="sm" variant="success-soft"
                            onClick={() => handleStatus(u.id, 'ACTIVE')}>Approve</Button>
                        )}
                        {u.status === 'ACTIVE' && (
                          <Button size="sm" variant="ghost"
                            onClick={() => handleStatus(u.id, 'REJECTED')}>Reject</Button>
                        )}
                        <Button size="sm" variant="danger-soft"
                          onClick={() => setDeleteId(u.id)}>Delete</Button>
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

      <ConfirmModal
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete user?"
        message="This will permanently delete the user and all their data. This action cannot be undone."
      />
    </div>
  );
}
