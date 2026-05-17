import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, FileText, CalendarPlus, ArrowLeft } from 'lucide-react';
import { getJobApplications, updateAppStatus, deleteApplication } from '../../api/applications';
import { getMyJobById } from '../../api/jobs';
import Badge from '../../components/ui/Badge';
import MatchBar from '../../components/ui/MatchBar';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import InterviewModal from '../../components/recruiter/InterviewModal';
import styles from './JobApplicantsPage.module.css';

const STATUSES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'];

function fmt(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function JobApplicantsPage() {
  const { jobId } = useParams();
  const navigate  = useNavigate();

  const [data, setData]               = useState(null);
  const [jobTitle, setJobTitle]       = useState('');
  const [page, setPage]               = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(false);
  const [deleteId, setDeleteId]       = useState(null);
  const [deleting, setDeleting]       = useState(false);
  const [interviewApp, setInterviewApp] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getJobApplications(jobId, page, statusFilter || undefined);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [jobId, page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    getMyJobById(jobId).then(r => setJobTitle(r.data?.title ?? '')).catch(() => {});
  }, [jobId]);

  const handleStatusChange = async (app, newStatus) => {
    if (newStatus === 'INTERVIEW') {
      setInterviewApp(app);
      return;
    }
    await updateAppStatus(app.id, newStatus);
    load();
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteApplication(deleteId); setDeleteId(null); load(); }
    finally { setDeleting(false); }
  };

  const displayed = (data?.content ?? []).filter(app =>
    !search || app.candidate?.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <button className={styles.back} onClick={() => navigate('/recruiter/jobs')}>
            <ArrowLeft size={14} strokeWidth={2.5} /> Back to jobs
          </button>
          <h2 className={styles.title}>
            Applicants{jobTitle && <span className={styles.jobTitleLabel}> — {jobTitle}</span>}
          </h2>
          <p className={styles.sub}>
            {data ? `${data.totalElements} application${data.totalElements !== 1 ? 's' : ''}` : '…'}
          </p>
        </div>
        <select className="form-select" style={{ width: 'auto' }}
          value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}>
          <option value="">All statuses</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
          ))}
        </select>
      </div>

      <div className={styles.searchBar}>
        <input
          className="form-control"
          placeholder="Search by name..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (setSearch(searchInput))}
        />
        <button className={styles.searchBtn} onClick={() => setSearch(searchInput)}>Search</button>
        {search && (
          <button className={styles.clearBtn} onClick={() => { setSearch(''); setSearchInput(''); }}>✕ Clear</button>
        )}
      </div>

      {loading && <p className={styles.loading}>Loading…</p>}

      {!loading && displayed.length === 0 && (
        <EmptyState icon={<Users size={44} />} title="No applicants"
          description={search ? 'No applicants match this name.' : statusFilter ? 'No applicants match this status.' : 'No one has applied yet.'} />
      )}

      {!loading && displayed.length > 0 && (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Match</th>
                  <th>Status</th>
                  <th>Applied</th>
                  <th>Change status</th>
                  <th>CV</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(app => (
                  <tr key={app.id}>
                    <td>
                      <div className={styles.candidateCell}>
                        <Avatar name={app.candidate?.fullName} size={32} />
                        <div>
                          <div className={styles.candidateName}>{app.candidate?.fullName}</div>
                          <div className={styles.candidateEmail}>{app.candidate?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className={styles.matchCell}>
                      <MatchBar percent={app.matchPercent} />
                    </td>
                    <td><Badge status={app.status} /></td>
                    <td className={styles.date}>{fmt(app.appliedAt)}</td>
                    <td>
                      <select className="form-select form-select-sm" style={{ minWidth: 130 }}
                        value={app.status}
                        onChange={e => handleStatusChange(app, e.target.value)}>
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {app.cvDraft ? (
                        <div className={styles.cvCell}>
                          <span className={styles.cvName}>{app.cvDraft.name}</span>
                          {app.cvDraft.fileUrl && (
                            <a href={app.cvDraft.fileUrl} target="_blank" rel="noreferrer"
                              className={styles.cvLink}>
                              <FileText size={13} /> View ↗
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className={styles.noCV}>—</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        {app.status === 'INTERVIEW' && (
                          <Button size="sm" variant="ghost" onClick={() => setInterviewApp(app)}
                            title="Schedule interview">
                            <CalendarPlus size={14} />
                          </Button>
                        )}
                        <Button size="sm" variant="danger-soft" onClick={() => setDeleteId(app.id)}>
                          Remove
                        </Button>
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

      <InterviewModal
        open={!!interviewApp}
        app={interviewApp}
        onClose={() => setInterviewApp(null)}
        onDone={() => { setInterviewApp(null); refresh(); }}
      />

      <ConfirmModal
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Remove application?"
        message="This will permanently delete this application. This action cannot be undone."
      />
    </div>
  );
}
