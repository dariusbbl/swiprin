import { useState, useEffect, useCallback } from 'react';
import { getMyApplications, withdrawApplication } from '../../api/applications';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Tag from '../../components/ui/Tag';
import styles from './MyApplicationsPage.module.css';

const STATUSES = ['', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'];
const WORK_MODE = { ON_SITE: 'On-site', REMOTE: 'Remote', HYBRID: 'Hybrid' };

export default function MyApplicationsPage() {
  const [data, setData]             = useState(null);
  const [page, setPage]             = useState(0);
  const [statusFilter, setStatus]   = useState('');
  const [loading, setLoading]       = useState(false);
  const [withdrawId, setWithdrawId] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyApplications(page, statusFilter || undefined);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      await withdrawApplication(withdrawId);
      setWithdrawId(null);
      load();
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>My Applications</h2>
          <p className={styles.sub}>Track the status of your job applications</p>
        </div>
        <select className="form-select" style={{ width: 'auto' }}
          value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(0); }}>
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All statuses'}</option>)}
        </select>
      </div>

      {loading && <p className={styles.loading}>Loading…</p>}

      {!loading && data?.content?.length === 0 && (
        <EmptyState icon="📋" title="No applications yet"
          description="Start swiping to apply for jobs that match your skills." />
      )}

      {!loading && data?.content?.length > 0 && (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Job title</th>
                  <th>Company</th>
                  <th>Work mode</th>
                  <th>Status</th>
                  <th>Applied on</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map(app => (
                  <tr key={app.id}>
                    <td className={styles.jobCell}>
                      <span className={styles.jobTitle}>{app.job.title}</span>
                      {app.shortlisted && <Tag variant="success">Shortlisted ✓</Tag>}
                    </td>
                    <td>{app.job.company?.name ?? '—'}</td>
                    <td><Tag>{WORK_MODE[app.job.workMode] ?? app.job.workMode}</Tag></td>
                    <td><Badge status={app.status} /></td>
                    <td className={styles.date}>
                      {new Date(app.appliedAt).toLocaleDateString('ro-RO')}
                    </td>
                    <td>
                      {!['WITHDRAWN','OFFER','REJECTED'].includes(app.status) && (
                        <button className={styles.withdrawBtn} onClick={() => setWithdrawId(app.id)}>
                          Withdraw
                        </button>
                      )}
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
        open={!!withdrawId} onClose={() => setWithdrawId(null)}
        onConfirm={handleWithdraw} loading={withdrawing}
        title="Withdraw application?"
        message="Your application will be marked as withdrawn. The recruiter will be notified."
      />
    </div>
  );
}
