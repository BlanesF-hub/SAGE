/* ============================================================
   SAGE — Change Password Page (forced on first login)
   ============================================================ */
import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { FiActivity, FiLock, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './AuthPages.css';

export default function ChangePasswordPage() {
  const [newUsername, setNewUsername] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      await authApi.changeCredentials(oldPassword, newPassword, newUsername || undefined);
      updateUser({ forcePasswordChange: false, usuario: newUsername || undefined });
      toast.success('Credenciales actualizadas exitosamente');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data || 'Error al actualizar credenciales');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orb auth-bg-orb--1" />
      <div className="auth-bg-orb auth-bg-orb--2" />

      <div className="auth-container animate-fade-in">
        <div className="auth-brand">
          <div className="auth-logo"><FiActivity /></div>
          <h1 className="auth-title">Configurar Cuenta</h1>
          <p className="auth-subtitle">Es tu primer inicio de sesión. Por seguridad, cambia tu usuario y contraseña.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-wrapper">
            <FiActivity className="auth-input-icon" />
            <input
              id="cp-username"
              type="text"
              className="auth-input"
              placeholder="Nuevo nombre de usuario (opcional)"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
          </div>

          <div className="auth-input-wrapper">
            <FiLock className="auth-input-icon" />
            <input
              id="cp-old"
              type="password"
              className="auth-input"
              placeholder="Contraseña provisoria actual"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>

          <div className="auth-input-wrapper">
            <FiLock className="auth-input-icon" />
            <input
              id="cp-new"
              type="password"
              className="auth-input"
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="auth-input-wrapper">
            <FiLock className="auth-input-icon" />
            <input
              id="cp-confirm"
              type="password"
              className="auth-input"
              placeholder="Confirmar nueva contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button id="cp-submit" type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Actualizar Credenciales'}
            {!loading && <FiArrowRight />}
          </button>
        </form>
      </div>
    </div>
  );
}
