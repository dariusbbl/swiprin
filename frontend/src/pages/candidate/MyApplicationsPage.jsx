import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Check, CalendarDays } from 'lucide-react';
import { getMyApplications, getMyApplicationCounts, withdrawApplication } from '../../api/applications';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Tag from '../../components/ui/Tag';
import InterviewDetailsModal from '../../components/candidate/InterviewDetailsModal';
import styles from './MyApplicationsPage.module.css';

const STATUS_TABS = [
  { key: '',           label: 'All' },
  { key: 'APPLIED',    label: 'Applied' },
  { key: 'SCREENING',  label: 'Screening' },
  { key: 'INTERVIEW',  label: 'Interview' },
  { key: 'OFFER',      label: 'Offer' },
  { key: 'REJECTED',   label: 'Rejected' },
  { key: 'WITHDRAWN',  label: 'Withdrawn' },
];

const WORK_MODE = { ON_SITE: 'On-site', REMOTE: 'Remote', HYBRID: 'Hybrid' };

export default function MyApplicationsPage() {
  const [data, setData]                         = useState(null);
  const [page, setPage]                         = useState(0);
  const [statusFilter, setStatus]               = useState('');
  const [shortlistedFilter, setShortlistedFilter] = useState('');
  const [sortBy, setSortBy]                     = useState('appliedAt');
  const [sortDir, setSortDir]                   = useState('desc');
  const [loading, setLoading]                   = useState(false);
  const [counts, setCounts]                     = useState({});
  const [withdrawId, setWithdrawId]             = useState(null);
  const [withdrawing, setWithdrawing]           = useState(false);
  const [ivApp, setIvApp]                       = useState(null);

  const shortlistedParam = shortlistedFilter === 'true' ? true : shortlistedFilter === 'false' ? false : null;

  const loadCounts = useCallback(() => {
    getMyApplicationCounts().then(r => setCounts(r.data ?? {})).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyApplications(page, statusFilter || undefined, shortlistedParam, sortBy, sortDir);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, shortlistedParam, sortBy, sortDir]);

  useEffect(() => { loadCounts(); }, [loadCounts]);
  useEffect(() => { load(); }, [load]);

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      await withdrawApplication(withdrawId);
      setWithdrawId(null);
      load();
      loadCounts();
    } finally {
      setWithdrawing(false);
    }
  };

  const selectStatus = (key) => { setStatus(key); setPage(0); };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>My Applications</h2>
          <p className={styles.sub}>Track the status of your job applications</p>
        </div>
      </div>

      <div className={styles.tabs}>
        {STATUS_TABS.map(tab => {
          const count = tab.key === '' ? counts.ALL : counts[tab.key];
          const active = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              className={[styles.tab, active ? styles.tabActive : ''].join(' ')}
              onClick={() => selectStatus(tab.key)}
            >
              {tab.label}
              {count > 0 && <span className={[styles.tabCount, active ? styles.tabCountActive : ''].join(' ')}>{count}</span>}
            </button>
          );
        })}
      </div>

      <div className={styles.filterRow}>
        {[
          { val: '',      label: 'All' },
          { val: 'true',  label: 'Shortlisted' },
          { val: 'false', label: 'Not shortlisted' },
        ].map(opt => (
          <button key={opt.val}
            className={[styles.chip, shortlistedFilter === opt.val ? styles.chipActive : ''].join(' ')}
            onClick={() => { setShortlistedFilter(opt.val); setPage(0); }}>
            {opt.label}
          </button>
        ))}

        <span className={styles.filterDivider} />

        {[
          { val: 'appliedAt_desc', label: 'Date ↓' },
          { val: 'appliedAt_asc',  label: 'Date ↑' },
        ].map(opt => (
          <button key={opt.val}
            className={[styles.chip, `${sortBy}_${sortDir}` === opt.val ? styles.chipActive : ''].join(' ')}
            onClick={() => {
              const [field, dir] = opt.val.split('_');
              setSortBy(field); setSortDir(dir); setPage(0);
            }}>
            {opt.label}
          </button>
        ))}
      </div>

      {loading && <p className={styles.loading}>Loading…</p>}

      {!loading && data?.content?.length === 0 && (
        <EmptyState icon={<ClipboardList size={44} />} title="No applications yet"
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
                    <td>
                      <div className={styles.jobCell}>
                        <span className={styles.jobTitle}>{app.job.title}</span>
                        {app.shortlisted && <Tag variant="success">Shortlisted <Check size={11} /></Tag>}
                      </div>
                    </td>
                    <td>{app.job.company?.name ?? '—'}</td>
                    <td><Tag>{WORK_MODE[app.job.workMode] ?? app.job.workMode}</Tag></td>
                    <td><Badge status={app.status} /></td>
                    <td className={styles.date}>
                      {new Date(app.appliedAt).toLocaleDateString('ro-RO')}
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        {!['WITHDRAWN','OFFER','REJECTED'].includes(app.status) && (
                          <button className={styles.withdrawBtn} onClick={() => setWithdrawId(app.id)}>
                            Withdraw
                          </button>
                        )}
                        {app.status === 'INTERVIEW' && (
                          <button className={styles.ivBtn} onClick={() => setIvApp(app)}
                            title="View interview details">
                            <CalendarDays size={14} /> Interview details
                          </button>
                        )}
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

      <InterviewDetailsModal
        open={!!ivApp}
        appId={ivApp?.id}
        jobTitle={ivApp?.job?.title}
        onClose={() => setIvApp(null)}
      />

      <ConfirmModal
        open={!!withdrawId} onClose={() => setWithdrawId(null)}
        onConfirm={handleWithdraw} loading={withdrawing}
        title="Withdraw application?"
        message="Your application will be marked as withdrawn. The recruiter will be notified."
      />
    </div>
  );
}
