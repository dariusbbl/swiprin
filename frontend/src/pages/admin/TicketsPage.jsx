import { Fragment, useState, useEffect, useCallback } from 'react';
import { Ticket } from 'lucide-react';
import { getAllTickets, resolveTicket, inProgressTicket, deleteTicket, approveDeletion } from '../../api/tickets';
import Tag from '../../components/ui/Tag';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Button from '../../components/ui/Button';
import styles from './TicketsPage.module.css';

const STATUS_OPTIONS = ['', 'OPEN', 'IN_PROGRESS', 'RESOLVED'];
const STATUS_LABEL   = { '': 'All statuses', OPEN: 'Open', IN_PROGRESS: 'In progress', RESOLVED: 'Resolved' };
const CAT_OPTIONS = ['', 'BUG_REPORT', 'FEATURE_REQUEST', 'ACCOUNT_ISSUE', 'DELETE_ACCOUNT', 'OTHER'];
const PRIORITY_VARIANT = { LOW: 'default', MEDIUM: 'warn', HIGH: 'danger' };
const PRIORITY_ORDER   = { HIGH: 0, MEDIUM: 1, LOW: 2 };
const CAT_LABEL = {
  BUG_REPORT: 'Bug report', FEATURE_REQUEST: 'Feature request',
  ACCOUNT_ISSUE: 'Account issue', DELETE_ACCOUNT: 'Delete account', OTHER: 'Other',
};

function fmt(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function TicketsPage() {
  const [data, setData]       = useState(null);
  const [page, setPage]       = useState(0);
  const [status, setStatus]   = useState('');
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [approveId, setApproveId] = useState(null);
  const [approving, setApproving] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [sortByPriority, setSortByPriority] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllTickets(status || undefined, page, category || undefined);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [page, status, category]);

  useEffect(() => { load(); }, [load]);

  const handleStatus   = (val) => { setStatus(val);   setPage(0); };
  const handleCategory = (val) => { setCategory(val); setPage(0); };

  const handleInProgress = async (id) => { await inProgressTicket(id); load(); };
  const handleResolve    = async (id) => { await resolveTicket(id); load(); };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteTicket(deleteId); setDeleteId(null); load(); }
    finally { setDeleting(false); }
  };

  const handleApproveDeletion = async () => {
    setApproving(true);
    try { await approveDeletion(approveId); setApproveId(null); load(); }
    finally { setApproving(false); }
  };

  const rawTickets = data?.content ?? [];
  const tickets = sortByPriority
    ? [...rawTickets].sort((a, b) => {
        const pa = PRIORITY_ORDER[a.priority] ?? 3;
        const pb = PRIORITY_ORDER[b.priority] ?? 3;
        return pa - pb;
      })
    : rawTickets;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Support Tickets</h2>
          <p className={styles.sub}>Review and resolve user feedback</p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          <button
            className={[styles.sortChip, sortByPriority ? styles.sortChipActive : ''].join(' ')}
            onClick={() => setSortByPriority(v => !v)}>
            Priority {sortByPriority ? '↓' : '↕'}
          </button>
          <select className="form-select" style={{ width: 'auto' }}
            value={category} onChange={e => handleCategory(e.target.value)}>
            <option value="">All categories</option>
            {CAT_OPTIONS.filter(c => c).map(c => (
              <option key={c} value={c}>{CAT_LABEL[c] ?? c}</option>
            ))}
          </select>
          <select className="form-select" style={{ width: 'auto' }}
            value={status} onChange={e => handleStatus(e.target.value)}>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p className={styles.loading}>Loading…</p>}

      {!loading && tickets.length === 0 && (
        <EmptyState icon={<Ticket size={44} />} title="No tickets" description="No tickets match the selected filter." />
      )}

      {!loading && tickets.length > 0 && (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>User</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <Fragment key={t.id}>
                    <tr className={styles.row}
                      onClick={() => setExpanded(expanded === t.id ? null : t.id)}>
                      <td className={styles.idCell}>{t.id}</td>
                      <td>
                        <div className={styles.userName}>{t.userFullName}</div>
                        <div className={styles.userEmail}>{t.userEmail}</div>
                      </td>
                      <td>
                        <Tag variant={t.category === 'DELETE_ACCOUNT' ? 'danger' : 'default'}>
                          {CAT_LABEL[t.category] ?? t.category}
                        </Tag>
                      </td>
                      <td>
                        {t.category !== 'DELETE_ACCOUNT'
                          ? <Tag variant={PRIORITY_VARIANT[t.priority]}>{t.priority}</Tag>
                          : <span style={{ color: 'var(--text-3)' }}>—</span>}
                      </td>
                      <td><Badge status={t.status} /></td>
                      <td className={styles.date}>{fmt(t.createdAt)}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className={styles.actions}>
                          {t.category === 'DELETE_ACCOUNT' && t.status !== 'RESOLVED' ? (
                            <Button size="sm" variant="danger-soft"
                              onClick={() => setApproveId(t.id)}>
                              Approve & delete
                            </Button>
                          ) : (
                            <>
                              {t.status === 'OPEN' && (
                                <Button size="sm" variant="ghost" onClick={() => handleInProgress(t.id)}>
                                  In progress
                                </Button>
                              )}
                              {t.status !== 'RESOLVED' && (
                                <Button size="sm" variant="success-soft" onClick={() => handleResolve(t.id)}>
                                  Resolve
                                </Button>
                              )}
                            </>
                          )}
                          <Button size="sm" variant="danger-soft" onClick={() => setDeleteId(t.id)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {expanded === t.id && (
                      <tr className={styles.expandRow}>
                        <td colSpan={7}>
                          <div className={styles.message}>{t.message}</div>
                          {t.resolvedByName && (
                            <div className={styles.resolvedBy}>
                              Resolved by <strong>{t.resolvedByName}</strong>
                              {t.resolvedAt ? ` on ${fmt(t.resolvedAt)}` : ''}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
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
        title="Delete ticket?"
        message="This will permanently remove the ticket. This action cannot be undone."
      />

      <ConfirmModal
        open={!!approveId} onClose={() => setApproveId(null)}
        onConfirm={handleApproveDeletion} loading={approving}
        title="Delete this account?"
        message="This will permanently delete the user's account and all associated data. The ticket will be marked as resolved. This action cannot be undone."
      />
    </div>
  );
}
