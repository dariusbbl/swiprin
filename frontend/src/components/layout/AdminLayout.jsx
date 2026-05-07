import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Users, Building2, Ticket, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import styles from './RecruiterLayout.module.css';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const footerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (footerRef.current && !footerRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

        <div className={styles.footer} ref={footerRef}>
          {menuOpen && (
            <div className={styles.userMenu}>
              <button className={styles.logoutBtn} onClick={handleLogout}>
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
          <Avatar name={user?.fullName} size={34} />
          <div className={styles.info}>
            <span className={styles.name}>{user?.fullName}</span>
            <span className={styles.role}>Admin</span>
          </div>
          <button className={[styles.chevron, menuOpen ? styles.chevronOpen : ''].join(' ')}
            onClick={() => setMenuOpen(m => !m)}>
            <ChevronRight size={16} />
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
