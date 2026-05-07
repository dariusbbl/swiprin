import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, MessageSquare, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getMe } from '../../api/users';
import Avatar from '../ui/Avatar';
import styles from './RecruiterLayout.module.css';

export default function RecruiterLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany]   = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const footerRef = useRef(null);

  useEffect(() => {
    getMe().then(r => setCompany(r.data?.company ?? null)).catch(() => {});
  }, []);

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
          <p className={styles.section}>Recruiter</p>
          <NavLink to="/recruiter"      end className={({ isActive }) => isActive ? styles.active : ''}>
            <LayoutDashboard size={16} /> Dashboard
          </NavLink>
          <NavLink to="/recruiter/jobs"     className={({ isActive }) => isActive ? styles.active : ''}>
            <Briefcase size={16} /> My Jobs
          </NavLink>
          <NavLink to="/recruiter/feedback" className={({ isActive }) => isActive ? styles.active : ''}>
            <MessageSquare size={16} /> Feedback
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
            <span className={styles.role}>{company?.name ?? 'Recruiter'}</span>
          </div>
          <button className={[styles.chevron, menuOpen ? styles.chevronOpen : ''].join(' ')}
            onClick={() => setMenuOpen(m => !m)}>
            <ChevronRight size={16} />
          </button>
        </div>
      </aside>

      <div className={styles.mainWrap}>
        <div className={styles.topBar}>
          {company && (
            <div className={styles.companyBadge}>
              <span className={styles.companyBadgeName}>{company.name}</span>
              <span className={styles.companyBadgeId}>#{company.id}</span>
            </div>
          )}
        </div>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
