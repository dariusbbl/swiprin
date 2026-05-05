import { useNavigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UnauthorizedPage() {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', gap:'1rem', color:'var(--text-3)' }}>
      <ShieldOff size={56} />
      <h2>Access denied</h2>
      <p style={{ color:'var(--text-2)' }}>You don't have permission to view this page.</p>
      <button className="btn btn-primary" onClick={() => { logout(); navigate('/login'); }}>
        Back to login
      </button>
    </div>
  );
}
