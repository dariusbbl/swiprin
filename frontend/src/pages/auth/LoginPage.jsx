import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MonitorSmartphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './AuthPage.module.css';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]   = useState({ email: '', password: '', remember: false });
  const [error, setError] = useState('');

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'CANDIDATE') navigate('/');
      else if (user.role === 'RECRUITER') navigate('/recruiter');
      else navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Login failed. Check your credentials.');
    }
  };

  return (
    <div className={styles.splitPage}>


      <div className={styles.formPanel}>
        <div className={styles.formInner}>

          <div className={styles.brand}>
            <div className={styles.brandIcon}>S</div>
            <span className={styles.brandName}>Swiprin</span>
          </div>

          <h1 className={styles.splitTitle}>Welcome back</h1>
          <p className={styles.splitSub}>Swipe through your next great job.</p>

          {error && <div className={styles.alert}>{error}</div>}

          <form onSubmit={submit} className={styles.form}>
            <div className={styles.field}>
              <label>Email</label>
              <input type="email" name="email" value={form.email}
                onChange={handle} required autoComplete="email"
                className="form-control" placeholder="alex@gmail.com" />
            </div>
            <div className={styles.field}>
              <label>Password</label>
              <input type="password" name="password" value={form.password}
                onChange={handle} required autoComplete="current-password"
                className="form-control" placeholder="••••••••" />
            </div>

            <div className={styles.rememberRow}>
              <label className={styles.checkLabel}>
                <input type="checkbox" name="remember" checked={form.remember} onChange={handle} />
                <span>Remember me</span>
              </label>
              <span className={styles.forgotLink}>Forgot password?</span>
            </div>

            <button type="submit" className={`btn btn-primary w-100 ${styles.submit}`} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className={styles.footer}>
            New here? <Link to="/register">Create an account →</Link>
          </p>
        </div>
      </div>


      <div className={styles.heroPanel}>
        <div className={styles.heroTag}>
          <MonitorSmartphone size={13} />
          Swipe-first hiring
        </div>

        <div className={styles.heroCardStack}>
          <div className={styles.heroCardBg} />
          <div className={styles.heroCard}>
            <div className={styles.heroAv}>L</div>
            <div className={styles.heroCardBody}>
              <p className={styles.heroJobTitle}>Senior FE Engineer</p>
              <p className={styles.heroJobCompany}>Lattice Loop</p>
              <div className={styles.heroTags}>
                <span>React</span>
                <span>TypeScript</span>
                <span>Remote</span>
              </div>
            </div>
            <div className={styles.heroMatch}>
              <span className={styles.heroMatchPct}>94%</span>
              <span className={styles.heroMatchLbl}>MATCH</span>
            </div>
          </div>
        </div>

        <div>
          <h2 className={styles.heroCopy}>
            Find your next role in the time it takes to drink a coffee.
          </h2>
          <p className={styles.heroStats}>12,400+ jobs · 2,300+ hiring teams</p>
        </div>
      </div>

    </div>
  );
}
