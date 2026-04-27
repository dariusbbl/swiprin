import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import styles from './RecruiterLayout.module.css';

export default function RecruiterLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>swiprin</div>

        <nav className={styles.nav}>
          <p className={styles.section}>Recruiter</p>
          <NavLink to="/recruiter"      end className={({ isActive }) => isActive ? styles.active : ''}>
            <span>📊</span> Dashboard
          </NavLink>
          <NavLink to="/recruiter/jobs"     className={({ isActive }) => isActive ? styles.active : ''}>
            <span>💼</span> My Jobs
          </NavLink>
        </nav>

        <div className={styles.footer}>
          <Avatar name={user?.fullName} size={34} />
          <div className={styles.info}>
            <span className={styles.name}>{user?.fullName}</span>
            <span className={styles.role}>Recruiter</span>
          </div>
          <button className={styles.logout} onClick={handleLogout} title="Logout">↪</button>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
