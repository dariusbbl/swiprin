import styles from './Badge.module.css';

const MAP = {
  APPLIED:    ['applied',    'Applied'],
  SCREENING:  ['screening',  'Screening'],
  INTERVIEW:  ['interview',  'Interview'],
  OFFER:      ['offer',      'Offer'],
  REJECTED:   ['danger',     'Rejected'],
  WITHDRAWN:  ['withdrawn',  'Withdrawn'],
  SHORTLISTED:['success',    'Shortlisted'],
};

export default function Badge({ status, className = '' }) {
  const [variant, label] = MAP[status] ?? ['default', status];
  return (
    <span className={[styles.badge, styles[variant], className].join(' ')}>
      {label}
    </span>
  );
}
