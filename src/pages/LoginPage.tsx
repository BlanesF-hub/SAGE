/* ============================================================
   SAGE — Login Page
   ============================================================ */
import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { FiActivity, FiUser, FiLock, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './AuthPages.css';

export default function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Superadmin hardcodeado
      if (usuario.trim() === 'Fgen562' && contrasena === 'medFacundo477') {
        const superAdminData = {
          id: 1,
          usuario: 'Fgen562',
          nombre: 'Facundo (Superadmin)',
          rol: 'ADMIN_GENERAL' as any,
          token: 'superadmin-token',
          forcePasswordChange: false,
        };
        login(superAdminData);
        toast.success(`Bienvenido, ${superAdminData.nombre}`);
        navigate('/');
        return;
      }

      const data = await authApi.login({ usuario: usuario.trim(), contrasena });
      login(data);
      toast.success(`Bienvenido, ${data.nombre}`);
      if (data.forcePasswordChange) {
        navigate('/cambiar-contrasena');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err?.response?.data || err?.message || 'Credenciales inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orb auth-bg-orb--1" />
      <div className="auth-bg-orb auth-bg-orb--2" />
      <div className="auth-bg-orb auth-bg-orb--3" />

      <div className="auth-container animate-fade-in">
        <div className="auth-nav-tabs">
          <button className="auth-tab auth-tab--active">Iniciar Sesión</button>
          <Link to="/registro" className="auth-tab">Registrar Paciente</Link>
        </div>

        <div className="auth-brand">
          <h2 className="auth-welcome">¡Bienvenido!</h2>
          <div className="auth-logo">
            <FiActivity />
          </div>
          <h1 className="auth-title">SAGE</h1>
          <p className="auth-subtitle">Sistema de Gestión de Clínica Médica</p>
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
          ¿No tenés cuenta? <Link to="/registro">Registrar Paciente</Link>
        </p>
      </div>
    </div>
  );
}
