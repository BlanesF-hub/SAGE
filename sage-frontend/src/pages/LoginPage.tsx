/* ============================================================
   SAGE — Login Page
   Premium glassmorphism login form with actor selector
   ============================================================ */
import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { FiActivity, FiUser, FiLock, FiArrowRight, FiShield, FiBriefcase, FiClipboard, FiUserCheck, FiHeart } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './AuthPages.css';

interface DemoActor {
  label: string;
  roleName: string;
  usuario: string;
  contrasena: string;
  icon: JSX.Element;
  color: string;
}

const DEMO_ACTORS: DemoActor[] = [
  { label: 'Admin General', roleName: 'Administrador del sistema', usuario: 'admin', contrasena: 'admin123', icon: <FiShield />, color: '#ec4899' },
  { label: 'Admin Consultorio', roleName: 'Gestión de clínica', usuario: 'admin_consultorio', contrasena: 'admin123', icon: <FiBriefcase />, color: '#8b5cf6' },
  { label: 'Secretario', roleName: 'Recepción y turnos', usuario: 'secretario', contrasena: 'admin123', icon: <FiClipboard />, color: '#3b82f6' },
  { label: 'Doctor', roleName: 'Médico especialista', usuario: 'doctor', contrasena: 'admin123', icon: <FiUserCheck />, color: '#10b981' },
  { label: 'Paciente', roleName: 'Atención médica', usuario: 'paciente', contrasena: 'admin123', icon: <FiHeart />, color: '#f59e0b' },
];

export default function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginWithCredentials = async (userStr: string, passStr: string) => {
    setLoading(true);
    try {
      const data = await authApi.login({ usuario: userStr, contrasena: passStr });
      login(data);
      toast.success(`Bienvenido, ${data.nombre}`);
      if (data.forcePasswordChange) {
        navigate('/cambiar-contrasena');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.response?.data || 'Credenciales inválidas. Verifica que la base de datos tenga los datos cargados.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleLoginWithCredentials(usuario, contrasena);
  };

  const selectActor = (actor: DemoActor) => {
    setUsuario(actor.usuario);
    setContrasena(actor.contrasena);
    handleLoginWithCredentials(actor.usuario, actor.contrasena);
  };

  return (
    <div className="auth-page">
      {/* Background effects */}
      <div className="auth-bg-orb auth-bg-orb--1" />
      <div className="auth-bg-orb auth-bg-orb--2" />
      <div className="auth-bg-orb auth-bg-orb--3" />

      <div className="auth-container animate-fade-in">
        <div className="auth-nav-tabs">
          <button className="auth-tab auth-tab--active">Iniciar Sesión</button>
          <Link to="/registro" className="auth-tab">Registrar Actor</Link>
        </div>

        <div className="auth-brand">
          <h2 className="auth-welcome">¡Bienvenido!</h2>
          <div className="auth-logo">
            <FiActivity />
          </div>
          <h1 className="auth-title">SAGE</h1>
          <p className="auth-subtitle">Sistema de Gestión de Clínica Médica</p>
        </div>

        {/* Quick Actor Selector */}
        <div className="actors-section">
          <span className="actors-title">Ingreso rápido por Actor:</span>
          <div className="actors-grid">
            {DEMO_ACTORS.map((actor) => (
              <button
                key={actor.usuario}
                type="button"
                className="actor-card"
                style={{ '--actor-accent': actor.color } as React.CSSProperties}
                onClick={() => selectActor(actor)}
                title={`Ingresar como ${actor.label}`}
              >
                <div className="actor-icon">{actor.icon}</div>
                <div className="actor-info">
                  <span className="actor-name">{actor.label}</span>
                  <span className="actor-desc">{actor.usuario}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="auth-divider">
          <span>o ingresá tus credenciales</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-wrapper">
            <FiUser className="auth-input-icon" />
            <input
              id="login-usuario"
              type="text"
              className="auth-input"
              placeholder="Usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
          </div>

          <div className="auth-input-wrapper">
            <FiLock className="auth-input-icon" />
            <input
              id="login-contrasena"
              type="password"
              className="auth-input"
              placeholder="Contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-lg auth-submit"
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
            {!loading && <FiArrowRight />}
          </button>
        </form>

        <p className="auth-footer">
          ¿Querés registrar un nuevo usuario? <Link to="/registro">Registrar un Actor</Link>
        </p>
      </div>
    </div>
  );
}
