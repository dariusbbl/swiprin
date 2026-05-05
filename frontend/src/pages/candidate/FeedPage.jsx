import { useState, useEffect, useCallback, useRef } from 'react';
import { getJobFeed } from '../../api/jobs';
import { applyToJob } from '../../api/applications';
import { getCvDrafts } from '../../api/cvDrafts';
import Tag from '../../components/ui/Tag';
import EmptyState from '../../components/ui/EmptyState';
import styles from './FeedPage.module.css';

const WORK_LABEL = { ON_SITE: 'On-site', REMOTE: 'Remote', HYBRID: 'Hybrid' };

export default function FeedPage() {
  const [cards, setCards]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [swipeDir, setSwipeDir] = useState(null);
  const [applyError, setApplyError] = useState('');

  const [cvDrafts, setCvDrafts]       = useState([]);
  const [selectedCvId, setSelectedCvId] = useState(null);

  // Use refs for pagination state so loadMore stays stable (no deps)
  const pageRef    = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res   = await getJobFeed(pageRef.current);
      const pd    = res.data;
      const fresh = (pd.content ?? []).filter(j => !j.applied);
      setCards(prev => [...prev, ...fresh]);
      hasMoreRef.current = !pd.last;
      pageRef.current   += 1;
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []); // stable — reads pagination via refs

  useEffect(() => { loadMore(); }, [loadMore]);

  // Load candidate's CV drafts once; auto-select default or only one
  useEffect(() => {
    getCvDrafts().then(r => {
      const drafts = r.data ?? [];
      setCvDrafts(drafts);
      if (drafts.length === 0) return;
      const def = drafts.find(d => d.isDefault) ?? drafts[0];
      setSelectedCvId(def.id);
    }).catch(() => {});
  }, []);

  // Preload when only 2 cards remain
  useEffect(() => {
    if (cards.length <= 2 && hasMoreRef.current && !loadingRef.current) loadMore();
  }, [cards.length, loadMore]);

  const top = cards[0];

  const removeTop = useCallback((direction) => {
    setSwipeDir(direction);
    setTimeout(() => {
      setCards(prev => {
        const next = prev.slice(1);
        if (next.length === 0 && !hasMoreRef.current) setDone(true);
        return next;
      });
      setSwipeDir(null);
    }, 320);
  }, []);

  const swipe = useCallback(async (direction) => {
    if (!top || swipeDir) return;
    setApplyError('');

    if (direction === 'right') {
      try {
        await applyToJob({ jobId: top.id, cvDraftId: selectedCvId ?? undefined });
      } catch (err) {
        const msg = err.response?.data?.message ?? 'Failed to apply. Please try again.';
        setApplyError(msg);
        return; // keep the card — do not remove it
      }
    }

    removeTop(direction);
  }, [top, swipeDir, removeTop, selectedCvId]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft')  swipe('left');
      if (e.key === 'ArrowRight') swipe('right');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [swipe]);

  if (done || (!loading && cards.length === 0 && !hasMoreRef.current)) {
    return (
      <div className={styles.page}>
        <EmptyState icon="🎉" title="You're all caught up!"
          description="No more new jobs right now. Check back later." />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.hint}>
        <span className={styles.hintSkip}>← Skip</span>
        <span className={styles.hintApply}>Apply →</span>
      </div>

      {applyError && (
        <div className={styles.errorBanner}>
          {applyError}
          <button className={styles.errorClose} onClick={() => setApplyError('')}>✕</button>
        </div>
      )}

      <div className={styles.stack}>
        {cards.slice(1, 3).map((job, i) => (
          <div key={job.id} className={styles.bgCard}
            style={{
              transform: `scale(${0.95 - i * 0.04}) translateY(${(i + 1) * 12}px)`,
              zIndex: 10 - i,
            }} />
        ))}

        {loading && cards.length === 0 && (
          <div className={[styles.card, styles.skeleton].join(' ')}>
            <p className={styles.skeletonText}>Loading jobs…</p>
          </div>
        )}

        {top && (
          <div className={[
            styles.card,
            swipeDir === 'left'  ? styles.flyLeft  : '',
            swipeDir === 'right' ? styles.flyRight : '',
          ].join(' ')}>

            {swipeDir === 'right' && (
              <div className={[styles.stamp, styles.stampApply].join(' ')}>APPLY</div>
            )}
            {swipeDir === 'left' && (
              <div className={[styles.stamp, styles.stampSkip].join(' ')}>SKIP</div>
            )}

            <div className={styles.cardTop}>
              <div>
                <h3 className={styles.jobTitle}>{top.title}</h3>
                {top.company?.name && <p className={styles.company}>{top.company.name}</p>}
                {top.location && <p className={styles.location}>📍 {top.location}</p>}
              </div>
              <Tag>{WORK_LABEL[top.workMode] ?? top.workMode}</Tag>
            </div>

            {top.skills?.length > 0 && (
              <div className={styles.skills}>
                {top.skills.map(s => (
                  <span key={s.id} className={styles.skill}>{s.name}</span>
                ))}
              </div>
            )}

            <p className={styles.desc}>{top.description}</p>

            <div className={styles.cardActions}>
              <button className={[styles.btn, styles.btnSkip].join(' ')}
                onClick={() => swipe('left')} disabled={!!swipeDir}>
                ✕ Skip
              </button>
              <button className={[styles.btn, styles.btnApply].join(' ')}
                onClick={() => swipe('right')} disabled={!!swipeDir}>
                ✓ Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {cvDrafts.length > 0 && (
        <div className={styles.cvSelector}>
          <label className={styles.cvLabel}>Apply with CV:</label>
          <select
            className="form-select form-select-sm"
            value={selectedCvId ?? ''}
            onChange={e => setSelectedCvId(Number(e.target.value))}
            style={{ maxWidth: 260 }}>
            {cvDrafts.map(cv => (
              <option key={cv.id} value={cv.id}>
                {cv.name}{cv.isDefault ? ' (default)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {cvDrafts.length === 0 && !loading && cards.length > 0 && (
        <p className={styles.noCvWarning}>
          You have no CV drafts. Add one in your profile to apply to jobs.
        </p>
      )}

      <p className={styles.keyHint}>Use ← → arrow keys to swipe</p>
    </div>
  );
}
