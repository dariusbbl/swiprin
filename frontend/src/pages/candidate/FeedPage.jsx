import { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, X, Check, Sparkles, CheckCircle2 } from 'lucide-react';
import { getJobFeed } from '../../api/jobs';
import { applyToJob } from '../../api/applications';
import { getCvDrafts } from '../../api/cvDrafts';
import Tag from '../../components/ui/Tag';
import EmptyState from '../../components/ui/EmptyState';
import LocationPicker from '../../components/ui/LocationPicker';
import CompanyProfileModal from '../../components/ui/CompanyProfileModal';
import styles from './FeedPage.module.css';

const WORK_LABEL = { ON_SITE: 'On-site', REMOTE: 'Remote', HYBRID: 'Hybrid' };
const SENIORITY_OPTS = [
  { value: null,          label: 'All' },
  { value: 'INTERNSHIP',  label: 'Internship' },
  { value: 'JUNIOR',      label: 'Junior' },
  { value: 'MID',         label: 'Mid' },
  { value: 'SENIOR',      label: 'Senior' },
];

function SkillsSection({ skills = [], matchedSkills = [] }) {
  const [showAll, setShowAll] = useState(false);
  const matchedIds = new Set(matchedSkills.map(s => s.id));
  const unmatched  = skills.filter(s => !matchedIds.has(s.id));
  const hasMore    = unmatched.length > 0;

  if (skills.length === 0) return null;

  return (
    <div className={styles.skillsSection}>
      {matchedSkills.length > 0 && (
        <div className={styles.skillsRow}>
          <span className={styles.skillsLabel}><CheckCircle2 size={12} /> Your skills</span>
          <div className={styles.skills}>
            {matchedSkills.map(s => (
              <span key={s.id} className={[styles.skill, styles.skillMatch].join(' ')}>{s.name}</span>
            ))}
          </div>
        </div>
      )}
      {hasMore && (
        <button type="button" className={styles.viewAllBtn} onClick={() => setShowAll(true)}>
          View all {skills.length} skills →
        </button>
      )}
      {showAll && (
        <div className={styles.skillPopupOverlay} onClick={() => setShowAll(false)}>
          <div className={styles.skillPopup} onClick={e => e.stopPropagation()}>
            <div className={styles.skillPopupHeader}>
              <span>All required skills</span>
              <button className={styles.skillPopupClose} onClick={() => setShowAll(false)}><X size={14} /></button>
            </div>
            {matchedSkills.length > 0 && (
              <div className={styles.skillPopupGroup}>
                <p className={styles.skillPopupGroupLabel}>Your skills</p>
                <div className={styles.skills}>
                  {matchedSkills.map(s => (
                    <span key={s.id} className={[styles.skill, styles.skillMatch].join(' ')}>{s.name}</span>
                  ))}
                </div>
              </div>
            )}
            {unmatched.length > 0 && (
              <div className={styles.skillPopupGroup}>
                {matchedSkills.length > 0 && <p className={styles.skillPopupGroupLabel}>Other required skills</p>}
                <div className={styles.skills}>
                  {unmatched.map(s => (
                    <span key={s.id} className={styles.skill}>{s.name}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FeedPage() {
  const [cards, setCards]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [swipeDir, setSwipeDir] = useState(null);
  const [applyError, setApplyError] = useState('');

  const [cvDrafts, setCvDrafts]       = useState([]);
  const [selectedCvId, setSelectedCvId] = useState(null);

  const [seniority, setSeniority] = useState(null);
  const [location, setLocation]   = useState('');
  const [profileCompany, setProfileCompany] = useState(null);

  const pageRef      = useRef(0);
  const hasMoreRef   = useRef(true);
  const loadingRef   = useRef(false);
  const seniorityRef = useRef(null);
  const locationRef  = useRef('');

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      let added = 0;
      while (hasMoreRef.current && added === 0) {
        const res   = await getJobFeed(pageRef.current, seniorityRef.current, locationRef.current);
        const pd    = res.data;
        const fresh = (pd.content ?? []).filter(j => !j.applied);
        added += fresh.length;
        if (fresh.length > 0) setCards(prev => [...prev, ...fresh]);
        hasMoreRef.current = !pd.last;
        pageRef.current   += 1;
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    seniorityRef.current = seniority;
    locationRef.current  = location;
    pageRef.current    = 0;
    hasMoreRef.current = true;
    loadingRef.current = false;
    setCards([]);
    setDone(false);
    setApplyError('');
    loadMore();
  }, [seniority, location, loadMore]);

  useEffect(() => {
    getCvDrafts().then(r => {
      const drafts = r.data ?? [];
      setCvDrafts(drafts);
      if (drafts.length === 0) return;
      const def = drafts.find(d => d.isDefault) ?? drafts[0];
      setSelectedCvId(def.id);
    }).catch(() => {});
  }, []);

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
        return;
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

  const isEmpty = (done || (!loading && cards.length === 0 && !hasMoreRef.current));

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.seniorityFilter}>
          {SENIORITY_OPTS.map(opt => (
            <button
              key={String(opt.value)}
              className={[styles.senChip, seniority === opt.value ? styles.senChipActive : ''].join(' ')}
              onClick={() => setSeniority(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className={styles.locationFilter}>
          <LocationPicker
            value={location}
            onChange={setLocation}
            placeholder="City or country…"
          />
        </div>
      </div>

      {isEmpty ? (
        <EmptyState icon={<Sparkles size={44} />} title="You're all caught up!"
          description="No more new jobs right now. Check back later." />
      ) : (
      <>
      <div className={styles.hint}>
        <span className={styles.hintSkip}>← Skip</span>
        <span className={styles.hintApply}>Apply →</span>
      </div>

      {applyError && (
        <div className={styles.errorBanner}>
          {applyError}
          <button className={styles.errorClose} onClick={() => setApplyError('')}><X size={14} /></button>
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
                {top.company?.name && (
                  <button className={styles.companyBtn} onClick={e => { e.stopPropagation(); setProfileCompany(top.company); }}>
                    {top.company.name}
                  </button>
                )}
                {top.location && <p className={styles.location}><MapPin size={13} /> {top.location}</p>}
              </div>
              <div className={styles.tagGroup}>
                <Tag>{WORK_LABEL[top.workMode] ?? top.workMode}</Tag>
                {top.paid != null && (
                  <Tag variant={top.paid ? 'success' : 'default'}>
                    {top.paid ? 'Paid' : 'Unpaid'}
                  </Tag>
                )}
              </div>
            </div>

            <SkillsSection skills={top.skills ?? []} matchedSkills={top.matchedSkills ?? []} />

            <div className={styles.desc} dangerouslySetInnerHTML={{ __html: top.description }} />

            <div className={styles.cardActions}>
              <button className={[styles.btn, styles.btnSkip].join(' ')}
                onClick={() => swipe('left')} disabled={!!swipeDir}>
                <X size={15} /> Skip
              </button>
              <button className={[styles.btn, styles.btnApply].join(' ')}
                onClick={() => swipe('right')} disabled={!!swipeDir}>
                <Check size={15} /> Apply
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
      </>
      )}

      <CompanyProfileModal
        open={!!profileCompany} onClose={() => setProfileCompany(null)}
        company={profileCompany}
      />
    </div>
  );
}
