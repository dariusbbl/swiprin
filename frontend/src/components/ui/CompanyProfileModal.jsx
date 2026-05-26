import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import Modal from './Modal';
import CompanyLogo from './CompanyLogo';
import Avatar from './Avatar';
import Tag from './Tag';
import { getCompanyRecruiters } from '../../api/companies';
import styles from './CompanyProfileModal.module.css';

function fmt(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CompanyProfileModal({ open, onClose, company, showRecruiters = false }) {
  const [recruiters, setRecruiters] = useState([]);
  const [loadingR, setLoadingR]     = useState(false);

  useEffect(() => {
    if (!open || !showRecruiters || !company?.id) { setRecruiters([]); return; }
    setLoadingR(true);
    getCompanyRecruiters(company.id)
      .then(r => setRecruiters(r.data))
      .catch(() => setRecruiters([]))
      .finally(() => setLoadingR(false));
  }, [open, showRecruiters, company?.id]);

  if (!company) return null;

  return (
    <Modal open={open} onClose={onClose} title="Company profile">
      <div className={styles.wrap}>

        <div className={styles.header}>
          <CompanyLogo name={company.name} size={52} />
          <div className={styles.headerInfo}>
            <div className={styles.name}>{company.name}</div>
            <div className={styles.meta}>
              <Tag variant={company.isVerified ? 'success' : 'warn'}>
                {company.isVerified ? 'Verified' : 'Unverified'}
              </Tag>
              <span className={styles.jobCount}>
                {company.jobCount ?? 0} active job{company.jobCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {company.description && (
          <div className={styles.section}>
            <p className={styles.label}>About</p>
            <p className={styles.desc}>{company.description}</p>
          </div>
        )}

        {company.website && (
          <div className={styles.section}>
            <p className={styles.label}>Website</p>
            <a href={company.website} target="_blank" rel="noreferrer" className={styles.link}>
              <ExternalLink size={13} /> {company.website}
            </a>
          </div>
        )}

        <div className={styles.section}>
          <p className={styles.label}>On platform since</p>
          <p className={styles.value}>{fmt(company.createdAt)}</p>
        </div>

        {showRecruiters && (
          <div className={styles.section}>
            <p className={styles.label}>Recruiters</p>
            {loadingR && <p className={styles.muted}>Loading…</p>}
            {!loadingR && recruiters.length === 0 && (
              <p className={styles.muted}>No recruiters found.</p>
            )}
            {!loadingR && recruiters.length > 0 && (
              <div className={styles.recruiterList}>
                {recruiters.map(r => (
                  <div key={r.id} className={styles.recruiterRow}>
                    <Avatar name={r.fullName} size={32} />
                    <div>
                      <div className={styles.recruiterName}>{r.fullName}</div>
                      <div className={styles.recruiterMeta}>
                        {r.jobTitle && <span>{r.jobTitle}</span>}
                        {r.jobTitle && r.email && <span className={styles.dot}>·</span>}
                        <span>{r.email}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </Modal>
  );
}
