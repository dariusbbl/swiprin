import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import styles from './RecruiterLayout.module.css'; // reuse same sidebar style

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>swiprin</div>

        <nav className={styles.nav}>
          <p className={styles.section}>Admin</p>
          <NavLink to="/admin/users"     className={({ isActive }) => isActive ? styles.active : ''}>
            <span>👥</span> Users
          </NavLink>
          <NavLink to="/admin/companies" className={({ isActive }) => isActive ? styles.active : ''}>
            <span>🏢</span> Companies
          </NavLink>
        </nav>

        <div className={styles.footer}>
          <Avatar name={user?.fullName} size={34} />
          <div className={styles.info}>
            <span className={styles.name}>{user?.fullName}</span>
            <span className={styles.role}>Admin</span>
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
