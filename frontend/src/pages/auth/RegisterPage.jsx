import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerCandidate, registerRecruiter } from '../../api/auth';
import styles from './AuthPage.module.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole]   = useState('CANDIDATE');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    phoneNumber: '', businessEmail: '',
    existingCompanyId: '', newCompanyName: '',
  });

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (role === 'CANDIDATE') {
        await registerCandidate({ fullName: form.fullName, email: form.email, password: form.password });
        navigate('/login', { state: { registered: true } });
      } else {
        const hasExisting = !!form.existingCompanyId;
        const hasNew = !!form.newCompanyName;
        if (!hasExisting && !hasNew) {
          setError('Please provide an existing company ID or a new company name.');
          setLoading(false);
          return;
        }
        if (hasExisting && hasNew) {
          setError('Choose either an existing company or a new company, not both.');
          setLoading(false);
          return;
        }
        await registerRecruiter({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          phoneNumber: form.phoneNumber || undefined,
          businessEmail: form.businessEmail || undefined,
          existingCompanyId: hasExisting ? Number(form.existingCompanyId) : undefined,
          newCompanyName: hasNew ? form.newCompanyName : undefined,
        });
        navigate('/login', { state: { registered: true, pending: true } });
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={[styles.card, styles.wide].join(' ')}>
        <div className={styles.logo}>swiprin</div>
        <h1 className={styles.title}>Create account</h1>

        <div className={styles.toggle}>
          <button type="button"
            className={role === 'CANDIDATE' ? styles.toggleActive : styles.toggleBtn}
            onClick={() => setRole('CANDIDATE')}>
            Candidate
          </button>
          <button type="button"
            className={role === 'RECRUITER' ? styles.toggleActive : styles.toggleBtn}
            onClick={() => setRole('RECRUITER')}>
            Recruiter
          </button>
        </div>

        {error && <div className={styles.alert}>{error}</div>}

        <form onSubmit={submit} className={styles.form}>
          <div className={styles.field}>
            <label>Full name</label>
            <input type="text" name="fullName" value={form.fullName} onChange={handle}
              required className="form-control" placeholder="John Doe" />
          </div>
          <div className={styles.field}>
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handle}
              required className="form-control" placeholder="you@example.com" />
          </div>
          <div className={styles.field}>
            <label>Password</label>
            <input type="password" name="password" value={form.password} onChange={handle}
              required minLength={6} className="form-control" placeholder="Min. 6 characters" />
          </div>
          <div className={styles.field}>
            <label>Confirm password</label>
            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handle}
              required className={['form-control', form.confirmPassword && form.confirmPassword !== form.password ? styles.inputError : ''].join(' ')}
              placeholder="Repeat password" />
            {form.confirmPassword && form.confirmPassword !== form.password && (
              <span className={styles.fieldError}>Passwords don't match</span>
            )}
          </div>

          {role === 'RECRUITER' && (
            <>
              <hr className={styles.divider} />
              <p className={styles.sectionLabel}>Company details</p>
              <div className={styles.field}>
                <label>Business email <span className={styles.opt}>(optional)</span></label>
                <input type="email" name="businessEmail" value={form.businessEmail} onChange={handle}
                  className="form-control" placeholder="recruiter@company.com" />
              </div>
              <div className={styles.field}>
                <label>Phone <span className={styles.opt}>(optional)</span></label>
                <input type="tel" name="phoneNumber" value={form.phoneNumber} onChange={handle}
                  className="form-control" placeholder="+40 700 000 000" />
              </div>
              <div className={styles.companyChoice}>
                <div className={styles.field} style={{ flex: 1 }}>
                  <label>Existing company ID</label>
                  <input type="number" name="existingCompanyId" value={form.existingCompanyId}
                    onChange={handle} className="form-control" placeholder="e.g. 3"
                    disabled={!!form.newCompanyName} />
                </div>
                <div className={styles.orDivider}>or</div>
                <div className={styles.field} style={{ flex: 1 }}>
                  <label>Create new company</label>
                  <input type="text" name="newCompanyName" value={form.newCompanyName}
                    onChange={handle} className="form-control" placeholder="Company name"
                    disabled={!!form.existingCompanyId} />
                </div>
              </div>
            </>
          )}

          <button type="submit" className={`btn btn-primary w-100 ${styles.submit}`} disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        {role === 'RECRUITER' && (
          <p className={styles.hint}>⏳ Recruiter accounts require admin approval before you can post jobs.</p>
        )}

        <p className={styles.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
