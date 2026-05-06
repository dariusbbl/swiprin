import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, MessageSquare, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getMe } from '../../api/users';
import Avatar from '../ui/Avatar';
import styles from './RecruiterLayout.module.css';

export default function RecruiterLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);

  useEffect(() => {
    getMe().then(r => setCompany(r.data?.company ?? null)).catch(() => {});
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

        <div className={styles.footer}>
          <Avatar name={user?.fullName} size={34} />
          <div className={styles.info}>
            <span className={styles.name}>{user?.fullName}</span>
            <span className={styles.role}>Recruiter</span>
          </div>
          <button className={styles.logout} onClick={handleLogout} title="Logout">
            <LogOut size={16} />
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
