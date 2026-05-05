import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { getMyJobs } from '../../api/jobs';
import Tag from '../../components/ui/Tag';
import Button from '../../components/ui/Button';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyJobs(0)
      .then(r => setJobs(r.data?.content ?? []))
      .finally(() => setLoading(false));
  }, []);

  const activeJobs = jobs.filter(j => j.active).length;
  const totalApps  = jobs.reduce((s, j) => s + (j.applicationCount ?? 0), 0);

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Dashboard</h2>
      <p className={styles.sub}>Welcome back! Here's an overview of your recruiting activity.</p>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statNum}>{loading ? '—' : jobs.length}</span>
          <span className={styles.statLabel}>Total jobs</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum}>{loading ? '—' : activeJobs}</span>
          <span className={styles.statLabel}>Active jobs</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum}>{loading ? '—' : totalApps}</span>
          <span className={styles.statLabel}>Total applications</span>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Your jobs</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/recruiter/jobs')}>
            View all →
          </Button>
        </div>

        {loading && <p className={styles.loading}>Loading…</p>}

        {!loading && jobs.length === 0 && (
          <div className={styles.empty}>
            No jobs yet.{' '}
            <button className={styles.link} onClick={() => navigate('/recruiter/jobs')}>
              Create your first job →
            </button>
          </div>
        )}

        {!loading && jobs.length > 0 && (
          <div className={styles.jobList}>
            {jobs.slice(0, 5).map(job => (
              <div key={job.id} className={styles.jobCard}>
                <div className={styles.jobInfo}>
                  <span className={styles.jobTitle}>{job.title}</span>
                  {job.location && <span className={styles.jobLoc}><MapPin size={12} /> {job.location}</span>}
                </div>
                <div className={styles.jobMeta}>
                  <Tag variant={job.active ? 'success' : 'default'}>
                    {job.active ? 'Active' : 'Closed'}
                  </Tag>
                  <span className={styles.appCount}>{job.applicationCount} applicants</span>
                  <Button size="sm" variant="ghost"
                    onClick={() => navigate(`/recruiter/jobs/${job.id}/applicants`)}>
                    View →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
