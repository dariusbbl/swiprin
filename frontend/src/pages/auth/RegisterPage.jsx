import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Clock } from 'lucide-react';
import { registerCandidate, registerRecruiter } from '../../api/auth';
import styles from './AuthPage.module.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole]             = useState('CANDIDATE');
  const [companyMode, setCompanyMode] = useState('new'); // 'existing' | 'new'
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState(false); // shows confirmation screen

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    phoneNumber: '', businessEmail: '', jobTitle: '',
    existingCompanyCode: '',
    newCompanyName: '', newCompanyWebsite: '', newCompanyDescription: '',
  });

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      if (role === 'CANDIDATE') {
        await registerCandidate({ fullName: form.fullName, email: form.email, password: form.password, confirmPassword: form.confirmPassword });
        setDone(true);
      } else {
        if (companyMode === 'existing' && !form.existingCompanyCode.trim()) {
          setError('Please enter the 6-digit company code.'); setLoading(false); return;
        }
        if (companyMode === 'existing' && !/^\d{6}$/.test(form.existingCompanyCode.trim())) {
          setError('Company code must be exactly 6 digits.'); setLoading(false); return;
        }
        if (companyMode === 'new' && !form.newCompanyName.trim()) {
          setError('Please enter the new company name.'); setLoading(false); return;
        }

        await registerRecruiter({
          fullName:        form.fullName,
          email:           form.email,
          password:        form.password,
          confirmPassword: form.confirmPassword,
          phoneNumber:     form.phoneNumber,
          businessEmail:   form.businessEmail,
          jobTitle:        form.jobTitle,
          existingCompanyCode:   companyMode === 'existing' ? form.existingCompanyCode.trim() : undefined,
          newCompanyName:        companyMode === 'new' ? form.newCompanyName.trim()           : undefined,
          newCompanyWebsite:     companyMode === 'new' && form.newCompanyWebsite     ? form.newCompanyWebsite.trim()     : undefined,
          newCompanyDescription: companyMode === 'new' && form.newCompanyDescription ? form.newCompanyDescription.trim() : undefined,
        });
        setDone(true);
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordMismatch = form.confirmPassword && form.confirmPassword !== form.password;

  if (done) {
    const isRecruiter = role === 'RECRUITER';
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.confirmIcon}>
            {isRecruiter ? <Clock size={48} /> : <CheckCircle2 size={48} />}
          </div>
          <h2 className={styles.confirmTitle}>
            {isRecruiter ? 'Account submitted!' : 'Account created!'}
          </h2>
          <p className={styles.confirmMsg}>
            {isRecruiter
              ? "Your recruiter account is pending admin approval. You'll be able to sign in once it's reviewed — this usually takes less than 24 hours."
              : 'Your account is ready. You can now sign in and start swiping through jobs.'}
          </p>
          <button className="btn btn-primary w-100" onClick={() => navigate('/login')}>
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={[styles.card, styles.wide].join(' ')}>
        <div className={styles.logo}>swiprin</div>
        <h1 className={styles.title}>Create account</h1>

        <div className={styles.toggle}>
          <button type="button"
            className={role === 'CANDIDATE' ? styles.toggleActive : styles.toggleBtn}
            onClick={() => setRole('CANDIDATE')}>Candidate</button>
          <button type="button"
            className={role === 'RECRUITER' ? styles.toggleActive : styles.toggleBtn}
            onClick={() => setRole('RECRUITER')}>Recruiter</button>
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
              required minLength={8} className="form-control" placeholder="Min. 8 characters" />
          </div>
          <div className={styles.field}>
            <label>Confirm password</label>
            <input type="password" name="confirmPassword" value={form.confirmPassword}
              onChange={handle} required
              className={['form-control', passwordMismatch ? styles.inputError : ''].join(' ')}
              placeholder="Repeat password" />
            {passwordMismatch && <span className={styles.fieldError}>Passwords don't match</span>}
          </div>


          {role === 'RECRUITER' && (
            <>
              <hr className={styles.divider} />
              <p className={styles.sectionLabel}>Professional details</p>

              <div className={styles.authRow2}>
                <div className={styles.field}>
                  <label>Business email</label>
                  <input type="email" name="businessEmail" value={form.businessEmail}
                    onChange={handle} required className="form-control"
                    placeholder="recruiter@company.com" />
                </div>
                <div className={styles.field}>
                  <label>Phone</label>
                  <input type="tel" name="phoneNumber" value={form.phoneNumber}
                    onChange={handle} required className="form-control"
                    placeholder="+40 700 000 000" />
                </div>
              </div>

              <div className={styles.field}>
                <label>Job title</label>
                <input type="text" name="jobTitle" value={form.jobTitle}
                  onChange={handle} required className="form-control"
                  placeholder="e.g. HR Manager, Talent Acquisition" />
              </div>

              <hr className={styles.divider} />
              <p className={styles.sectionLabel}>Company</p>

              <div className={styles.toggle}>
                <button type="button"
                  className={companyMode === 'existing' ? styles.toggleActive : styles.toggleBtn}
                  onClick={() => setCompanyMode('existing')}>
                  Link to existing company
                </button>
                <button type="button"
                  className={companyMode === 'new' ? styles.toggleActive : styles.toggleBtn}
                  onClick={() => setCompanyMode('new')}>
                  Create new company
                </button>
              </div>

              {companyMode === 'existing' && (
                <div className={styles.field}>
                  <label>Company code *</label>
                  <input type="text" name="existingCompanyCode" value={form.existingCompanyCode}
                    onChange={handle} required className="form-control"
                    placeholder="6-digit code, e.g. 482917"
                    maxLength={6} inputMode="numeric"
                    pattern="\d{6}" />
                  <span className={styles.fieldHint}>Ask your company admin for the 6-digit code shown in their account.</span>
                </div>
              )}

              {companyMode === 'new' && (
                <>
                  <div className={styles.authRow2}>
                    <div className={styles.field}>
                      <label>Company name *</label>
                      <input type="text" name="newCompanyName" value={form.newCompanyName}
                        onChange={handle} required className="form-control" placeholder="e.g. Acme Corp" />
                    </div>
                    <div className={styles.field}>
                      <label>Website</label>
                      <input type="url" name="newCompanyWebsite" value={form.newCompanyWebsite}
                        onChange={handle} className="form-control" placeholder="https://acme.com" />
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label>Description</label>
                    <textarea name="newCompanyDescription" value={form.newCompanyDescription}
                      onChange={handle} rows={3} className="form-control"
                      placeholder="A short description of your company…" />
                  </div>
                </>
              )}
            </>
          )}

          <button type="submit" className={`btn btn-primary w-100 ${styles.submit}`} disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        {role === 'RECRUITER' && (
          <p className={styles.hint}>Recruiter accounts require admin approval before you can post jobs.</p>
        )}

        <p className={styles.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
