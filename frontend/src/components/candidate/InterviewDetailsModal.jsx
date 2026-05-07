import { useState, useEffect } from 'react';
import { Calendar, Clock, Video, MapPin, FileText } from 'lucide-react';
import { getMyAppInterviews } from '../../api/interviews';
import Modal from '../ui/Modal';
import styles from './InterviewDetailsModal.module.css';

function fmtDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}
function fmtTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function InterviewDetailsModal({ open, appId, jobTitle, onClose }) {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    if (!open || !appId) return;
    setLoading(true);
    getMyAppInterviews(appId)
      .then(r => setInterviews(r.data ?? []))
      .finally(() => setLoading(false));
  }, [open, appId]);

  return (
    <Modal open={open} onClose={onClose} title="Interview details">
      <div className={styles.wrap}>
        {jobTitle && <p className={styles.jobTitle}>{jobTitle}</p>}

        {loading && <p className={styles.loading}>Loading…</p>}

        {!loading && interviews.length === 0 && (
          <p className={styles.empty}>No interview scheduled yet. Check back later.</p>
        )}

        {!loading && interviews.map((iv, idx) => (
          <div key={iv.id} className={styles.card}>
            {interviews.length > 1 && (
              <span className={styles.round}>Round {idx + 1}</span>
            )}

            <h3 className={styles.ivTitle}>{iv.title}</h3>

            <div className={styles.rows}>
              <div className={styles.row}>
                <Calendar size={15} className={styles.icon} />
                <span>{fmtDate(iv.scheduledAt)}</span>
              </div>
              <div className={styles.row}>
                <Clock size={15} className={styles.icon} />
                <span>{fmtTime(iv.scheduledAt)}</span>
              </div>
              <div className={styles.row}>
                {iv.mode === 'ONLINE'
                  ? <Video size={15} className={styles.icon} />
                  : <MapPin size={15} className={styles.icon} />
                }
                <span>{iv.mode === 'ONLINE' ? 'Online' : 'On-site'}</span>
              </div>
              {iv.location && (
                <div className={styles.row}>
                  <span className={styles.iconSpacer} />
                  {iv.mode === 'ONLINE'
                    ? <a href={iv.location} target="_blank" rel="noreferrer" className={styles.link}>{iv.location}</a>
                    : <span>{iv.location}</span>
                  }
                </div>
              )}
            </div>

            {iv.description && (
              <div className={styles.noteBox}>
                <div className={styles.noteHeader}>
                  <FileText size={13} /> Note from recruiter
                </div>
                <p className={styles.noteText}>{iv.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
