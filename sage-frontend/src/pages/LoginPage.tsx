/* ============================================================
   SAGE — Login Page
   Premium glassmorphism login form
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
      const data = await authApi.login({ usuario, contrasena });
      login(data);
      toast.success(`Bienvenido, ${data.nombre}`);
      if (data.forcePasswordChange) {
        navigate('/cambiar-contrasena');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.response?.data || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background effects */}
      <div className="auth-bg-orb auth-bg-orb--1" />
      <div className="auth-bg-orb auth-bg-orb--2" />
      <div className="auth-bg-orb auth-bg-orb--3" />

      <div className="auth-container animate-fade-in">
        <div className="auth-brand">
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
              autoFocus
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
          ¿No tenés cuenta? <Link to="/registro">Registrate como paciente</Link>
        </p>
      </div>
    </div>
  );
}
