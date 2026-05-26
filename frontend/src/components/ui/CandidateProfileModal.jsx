import { useEffect, useState } from 'react';
import { ExternalLink, MapPin, GraduationCap } from 'lucide-react';
import Modal from './Modal';
import Avatar from './Avatar';
import { getUserProfile } from '../../api/users';
import styles from './CandidateProfileModal.module.css';

const EDU_LABEL = {
  HIGHSCHOOL: 'High School',
  BACHELOR:   "Bachelor's",
  MASTER:     "Master's",
  PHD:        'PhD',
  BOOTCAMP:   'Bootcamp',
  OTHER:      'Other',
};

export default function CandidateProfileModal({ open, onClose, candidate, jobSkills }) {
  // candidate: UserResponse (id, fullName, email, skills, jobTitle)
  // jobSkills: skill objects from the job — when present, shows matched vs extra (recruiter view)
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !candidate?.id) { setProfile(null); return; }
    setLoading(true);
    getUserProfile(candidate.id)
      .then(r => setProfile(r.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [open, candidate?.id]);

  if (!candidate) return null;

  const jobSkillIds = new Set((jobSkills || []).map(s => s.id));
  const matched = jobSkills ? (candidate.skills || []).filter(s => jobSkillIds.has(s.id)) : null;
  const extra   = jobSkills ? (candidate.skills || []).filter(s => !jobSkillIds.has(s.id)) : null;

  const hasEdu = profile && (profile.educationLevel || profile.faculty || profile.graduationYear);

  return (
    <Modal open={open} onClose={onClose} title="Candidate profile" size="md">
      <div className={styles.wrap}>

        <div className={styles.header}>
          <Avatar name={candidate.fullName} size={48} />
          <div>
            <div className={styles.name}>{candidate.fullName}</div>
            {candidate.jobTitle && <div className={styles.jobTitle}>{candidate.jobTitle}</div>}
            <div className={styles.email}>{candidate.email}</div>
          </div>
        </div>

        {loading && <p className={styles.loading}>Loading profile…</p>}

        {profile && !loading && (
          <>
            {profile.bio && (
              <div className={styles.section}>
                <p className={styles.label}>Bio</p>
                <p className={styles.bio}>{profile.bio}</p>
              </div>
            )}

            {profile.currentLocation && (
              <div className={styles.metaRow}>
                <MapPin size={13} className={styles.metaIcon} />
                <span className={styles.metaText}>{profile.currentLocation}</span>
              </div>
            )}

            {hasEdu && (
              <div className={styles.section}>
                <p className={styles.label}>Education</p>
                <div className={styles.metaRow}>
                  <GraduationCap size={13} className={styles.metaIcon} />
                  <span className={styles.metaText}>
                    {profile.educationLevel && <strong>{EDU_LABEL[profile.educationLevel] ?? profile.educationLevel}</strong>}
                    {profile.faculty && <> · {profile.faculty}</>}
                    {profile.graduationYear && <> · {profile.graduationYear}</>}
                  </span>
                </div>
              </div>
            )}

            {(profile.linkedInUrl || profile.githubUrl) && (
              <div className={styles.links}>
                {profile.linkedInUrl && (
                  <a href={profile.linkedInUrl} target="_blank" rel="noreferrer" className={styles.link}>
                    <ExternalLink size={13} /> LinkedIn
                  </a>
                )}
                {profile.githubUrl && (
                  <a href={profile.githubUrl} target="_blank" rel="noreferrer" className={styles.link}>
                    <ExternalLink size={13} /> GitHub
                  </a>
                )}
              </div>
            )}
          </>
        )}

        {(candidate.skills?.length > 0) && (
          <div className={styles.section}>
            <p className={styles.label}>Skills</p>
            {jobSkills ? (
              <div className={styles.skillGroups}>
                {matched?.length > 0 && (
                  <div className={styles.skillGroup}>
                    <span className={styles.skillGroupLabel}>Matches job</span>
                    <div className={styles.skillWrap}>
                      {matched.map(s => (
                        <span key={s.id} className={[styles.chip, styles.chipMatched].join(' ')}>{s.name}</span>
                      ))}
                    </div>
                  </div>
                )}
                {extra?.length > 0 && (
                  <div className={styles.skillGroup}>
                    <span className={styles.skillGroupLabel}>Additional</span>
                    <div className={styles.skillWrap}>
                      {extra.map(s => (
                        <span key={s.id} className={styles.chip}>{s.name}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.skillWrap}>
                {candidate.skills.map(s => (
                  <span key={s.id} className={styles.chip}>{s.name}</span>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </Modal>
  );
}
