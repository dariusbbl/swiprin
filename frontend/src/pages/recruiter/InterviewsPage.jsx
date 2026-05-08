import { useState, useEffect, useMemo } from 'react';
import { Video, MapPin, Clock, ChevronRight, CalendarClock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCompanyInterviews } from '../../api/interviews';
import { getMyJobs } from '../../api/jobs';
import RescheduleModal from '../../components/recruiter/RescheduleModal';
import styles from './InterviewsPage.module.css';

const DOW  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MON  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function parseDt(str) {
  if (!str) return null;
  return new Date(str);
}

function fmtTime(str) {
  const d = parseDt(str);
  if (!d) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function InterviewsPage() {
  const navigate = useNavigate();
  const [interviews,   setInterviews]   = useState([]);
  const [jobs,         setJobs]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [jobFilter,    setJobFilter]    = useState(null);
  const [rescheduleIv, setRescheduleIv] = useState(null);

  useEffect(() => {
    getMyJobs(0, null, 100)
      .then(r => setJobs(r.data?.content ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    getCompanyInterviews(jobFilter)
      .then(r => setInterviews(r.data?.content ?? []))
      .catch(e => {
        setInterviews([]);
        setError(e.response?.data?.message ?? 'Failed to load interviews.');
      })
      .finally(() => setLoading(false));
  }, [jobFilter]);

  const now = new Date();

  const upcoming = useMemo(() =>
    interviews.filter(i => { const d = parseDt(i.scheduledAt); return d && d > now; }).length,
  [interviews]);

  const thisMonth = useMemo(() =>
    interviews.filter(i => {
      const d = parseDt(i.scheduledAt);
      return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  [interviews]);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Interviews</h1>
          <p className={styles.sub}>
            {interviews.length} scheduled
            {upcoming > 0 && ` · ${upcoming} upcoming`}
          </p>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Upcoming</span>
          <span className={[styles.statVal, styles.blue].join(' ')}>{upcoming}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>This month</span>
          <span className={[styles.statVal, styles.green].join(' ')}>{thisMonth}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total</span>
          <span className={[styles.statVal, styles.neutral].join(' ')}>{interviews.length}</span>
        </div>
      </div>

      {jobs.length > 0 && (
        <div className={styles.filters}>
          <button
            className={[styles.chip, jobFilter === null ? styles.chipActive : ''].join(' ')}
            onClick={() => setJobFilter(null)}
          >
            All jobs
          </button>
          {jobs.map(j => (
            <button
              key={j.id}
              className={[styles.chip, jobFilter === j.id ? styles.chipActive : ''].join(' ')}
              onClick={() => setJobFilter(j.id)}
            >
              {j.title}
            </button>
          ))}
        </div>
      )}

      {error && <p className={styles.errMsg}>{error}</p>}
      {loading && <p className={styles.loading}>Loading…</p>}

      {!loading && interviews.length === 0 && (
        <div className={styles.empty}>
          <p>No interviews scheduled yet.</p>
        </div>
      )}

      {!loading && interviews.length > 0 && (
        <div className={styles.list}>
          {interviews.map(iv => {
            const dt       = parseDt(iv.scheduledAt);
            const isOnline = iv.mode === 'ONLINE';
            const isPast   = dt && dt < now;

            return (
              <div key={iv.id} className={[styles.card, isPast ? styles.cardPast : ''].join(' ')}>
                <div className={styles.dateBox}>
                  <span className={styles.dow}>{dt ? DOW[dt.getDay()] : '—'}</span>
                  <span className={styles.day}>{dt ? dt.getDate() : '—'}</span>
                  <span className={styles.mon}>{dt ? MON[dt.getMonth()] : ''}</span>
                </div>

                <div className={styles.content}>
                  <div className={styles.topRow}>
                    <span className={[styles.badge, isOnline ? styles.badgeVideo : styles.badgeOnsite].join(' ')}>
                      {isOnline ? 'Video' : 'On-site'}
                    </span>
                    <span className={styles.jobTag}>{iv.jobTitle}</span>
                  </div>
                  <p className={styles.ivTitle}>{iv.title}</p>
                  <p className={styles.candidate}>{iv.candidateName}</p>
                  <div className={styles.meta}>
                    <span className={styles.metaItem}>
                      <Clock size={12} /> {fmtTime(iv.scheduledAt)}
                    </span>
                    {isOnline
                      ? <span className={styles.metaItem}><Video size={12} /> Online</span>
                      : <span className={styles.metaItem}><MapPin size={12} /> On-site</span>
                    }
                    {iv.location && !isOnline && (
                      <span className={styles.metaItem}>{iv.location}</span>
                    )}
                  </div>
                </div>

                <div className={styles.actions}>
                  {isOnline && iv.location && (
                    <a
                      href={iv.location}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.joinBtn}
                    >
                      <Video size={13} /> Join
                    </a>
                  )}
                  <button
                    className={styles.rescheduleBtn}
                    onClick={() => setRescheduleIv(iv)}
                  >
                    <CalendarClock size={13} /> Reschedule
                  </button>
                  <button
                    className={styles.viewBtn}
                    onClick={() => navigate(`/recruiter/jobs/${iv.jobId}/applicants`)}
                  >
                    Applicants <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RescheduleModal
        open={!!rescheduleIv}
        interview={rescheduleIv}
        onClose={() => setRescheduleIv(null)}
        onDone={() => {
          setRescheduleIv(null);
          setLoading(true);
          getCompanyInterviews(jobFilter)
            .then(r => setInterviews(r.data?.content ?? []))
            .catch(() => {})
            .finally(() => setLoading(false));
        }}
      />
    </div>
  );
}
