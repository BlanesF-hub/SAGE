/* ============================================================
   SAGE — Main Layout (Sidebar + Header + Content)
   ============================================================ */
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiCalendar,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiActivity,
  FiClipboard,
  FiHome,
  FiUser,
  FiMessageSquare,
} from 'react-icons/fi';
import './Layout.css';

const NAV_ITEMS: Record<string, { label: string; icon: JSX.Element; path: string }[]> = {
  PACIENTE: [
    { label: 'Mis Turnos', icon: <FiCalendar />, path: '/paciente' },
  ],
  SECRETARIO: [
    { label: 'Agenda', icon: <FiCalendar />, path: '/secretario' },
    { label: 'WhatsApp', icon: <FiMessageSquare />, path: '/whatsapp' },
  ],
  DOCTOR: [
    { label: 'Panel principal', icon: <FiActivity />, path: '/doctor' },
    { label: 'Agenda', icon: <FiCalendar />, path: '/doctor/agenda' },
    { label: 'WhatsApp', icon: <FiMessageSquare />, path: '/whatsapp' },
  ],
  ADMIN_GENERAL: [
    { label: 'Dashboard', icon: <FiHome />, path: '/admin' },
  ],
  ADMIN_CONSULTORIO: [
    { label: 'Personal', icon: <FiUsers />, path: '/consultorio-admin' },
    { label: 'WhatsApp', icon: <FiMessageSquare />, path: '/whatsapp' },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const items = NAV_ITEMS[user.rol] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      {/* ── Sidebar ─────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <FiActivity />
          </div>
          <span className="sidebar-title">SAGE</span>
        </div>

        <nav className="sidebar-nav">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/doctor'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
              }
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span className="sidebar-link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-link" onClick={handleLogout}>
            <span className="sidebar-link-icon"><FiLogOut /></span>
            <span className="sidebar-link-label">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────── */}
      <div className="layout-main">
        <header className="topbar">
          <div className="topbar-left">
            <h2 className="topbar-greeting">
              Hola, <span className="topbar-name">{user.nombre}</span>
            </h2>
          </div>
          <div className="topbar-right">
            <span className="badge badge-primary">{user.rol.replace(/_/g, ' ')}</span>
            <div className="topbar-avatar">
              <FiUser />
            </div>
          </div>
        </header>

        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
