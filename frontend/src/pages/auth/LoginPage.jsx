import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './AuthPage.module.css';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

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
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>swiprin</div>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.sub}>Sign in to continue</p>

        {error && <div className={styles.alert}>{error}</div>}

        <form onSubmit={submit} className={styles.form}>
          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email" name="email" value={form.email}
              onChange={handle} required autoComplete="email"
              className="form-control" placeholder="you@example.com"
            />
          </div>
          <div className={styles.field}>
            <label>Password</label>
            <input
              type="password" name="password" value={form.password}
              onChange={handle} required autoComplete="current-password"
              className="form-control" placeholder="••••••••"
            />
          </div>
          <button type="submit" className={`btn btn-primary w-100 ${styles.submit}`} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className={styles.footer}>
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
