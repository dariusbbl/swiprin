import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function UnauthorizedPage() {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', gap:'1rem' }}>
      <h1 style={{ fontSize:'3rem' }}>🚫</h1>
      <h2>Access denied</h2>
      <p style={{ color:'var(--text-2)' }}>You don't have permission to view this page.</p>
      <button className="btn btn-primary" onClick={() => { logout(); navigate('/login'); }}>
        Back to login
      </button>
    </div>
  );
}
