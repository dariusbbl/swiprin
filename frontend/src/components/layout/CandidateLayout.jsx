import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import styles from './CandidateLayout.module.css';

export default function CandidateLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={styles.shell}>
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <span className={styles.logo}>swiprin</span>
        </div>

        <div className={styles.links}>
          <NavLink to="/"            end className={({ isActive }) => isActive ? styles.active : ''}>Discover</NavLink>
          <NavLink to="/applications"    className={({ isActive }) => isActive ? styles.active : ''}>Applications</NavLink>
          <NavLink to="/profile"         className={({ isActive }) => isActive ? styles.active : ''}>Profile</NavLink>
        </div>

        <div className={styles.user}>
          <Avatar name={user?.fullName} size={32} />
          <span className={styles.name}>{user?.fullName}</span>
          <button className={styles.logout} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
