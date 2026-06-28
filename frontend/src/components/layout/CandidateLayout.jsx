import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import BrandLogo from '../ui/BrandLogo';
import { getNotifications, getUnreadCount, markOneAsRead, markAllAsRead } from '../../api/notifications';
import styles from './CandidateLayout.module.css';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function CandidateLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [unread, setUnread]           = useState(0);
  const [open, setOpen]               = useState(false);
  const [notifications, setNotifs]    = useState([]);
  const [loadingNotifs, setLoading]   = useState(false);
  const bellRef = useRef(null);

  const fetchUnread = useCallback(() => {
    return getUnreadCount().then(r => setUnread(r.data.count ?? 0)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchUnread();
    const id = setInterval(fetchUnread, 15000);

    const onFocus = () => fetchUnread();
    const onVisibility = () => { if (document.visibilityState === 'visible') fetchUnread(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchUnread]);

  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleBell = async () => {
    if (!open) {
      setLoading(true);
      try {
        const [listRes] = await Promise.all([
          getNotifications(0, 20),
          fetchUnread(),
        ]);
        setNotifs(listRes.data.content ?? []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    setOpen(o => !o);
  };

  const handleMarkOne = async (notif) => {
    if (notif.isRead) return;
    try {
      await markOneAsRead(notif.id);
      setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      setUnread(u => Math.max(0, u - 1));
    } catch { /* ignore */ }
  };

  const handleMarkAll = async () => {
    try {
      await markAllAsRead();
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnread(0);
    } catch { /* ignore */ }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={styles.shell}>
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <BrandLogo />
        </div>

        <div className={styles.links}>
          <NavLink to="/"            end className={({ isActive }) => isActive ? styles.active : ''}>Discover</NavLink>
          <NavLink to="/applications"    className={({ isActive }) => isActive ? styles.active : ''}>Applications</NavLink>
          <NavLink to="/profile"         className={({ isActive }) => isActive ? styles.active : ''}>Profile</NavLink>
          <NavLink to="/feedback"        className={({ isActive }) => isActive ? styles.active : ''}>Feedback</NavLink>
        </div>

        <div className={styles.user}>
          <div className={styles.bellWrap} ref={bellRef}>
            <button className={styles.bellBtn} onClick={toggleBell} aria-label="Notifications">
              <Bell size={18} />
              {unread > 0 && <span className={styles.badge}>{unread > 99 ? '99+' : unread}</span>}
            </button>

            {open && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownHeader}>
                  <span>Notifications</span>
                  {unread > 0 && (
                    <button className={styles.markAllBtn} onClick={handleMarkAll}>
                      Mark all as read
                    </button>
                  )}
                </div>
                {loadingNotifs ? (
                  <div className={styles.dropdownEmpty}>Loading…</div>
                ) : notifications.length === 0 ? (
                  <div className={styles.dropdownEmpty}>No notifications yet.</div>
                ) : (
                  <ul className={styles.notifList}>
                    {notifications.map(n => (
                      <li key={n.id}
                        className={[styles.notifItem, n.isRead ? styles.notifRead : styles.notifUnread].join(' ')}
                        onClick={() => handleMarkOne(n)}>
                        <span className={styles.notifMsg} dangerouslySetInnerHTML={{ __html: n.message }} />
                        <span className={styles.notifTime}>{timeAgo(n.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

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
