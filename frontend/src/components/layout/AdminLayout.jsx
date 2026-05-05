import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Users, Building2, Ticket, LogOut } from 'lucide-react';
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
            <Users size={16} /> Users
          </NavLink>
          <NavLink to="/admin/companies" className={({ isActive }) => isActive ? styles.active : ''}>
            <Building2 size={16} /> Companies
          </NavLink>
          <NavLink to="/admin/tickets"   className={({ isActive }) => isActive ? styles.active : ''}>
            <Ticket size={16} /> Tickets
          </NavLink>
        </nav>

        <div className={styles.footer}>
          <Avatar name={user?.fullName} size={34} />
          <div className={styles.info}>
            <span className={styles.name}>{user?.fullName}</span>
            <span className={styles.role}>Admin</span>
          </div>
          <button className={styles.logout} onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
