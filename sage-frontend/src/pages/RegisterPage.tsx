/* ============================================================
   SAGE — Register Page (Paciente self-registration)
   ============================================================ */
import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import type { TipoPaciente } from '../types';
import { FiActivity, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './AuthPages.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    usuario: '',
    contrasena: '',
    nombrePaciente: '',
    dniPaciente: '',
    nroTelefonoPaciente: '',
    fechaNacimiento: '',
    direccionPaciente: '',
    tipoPaciente: 'PARTICULAR' as TipoPaciente,
    nroAfiliado: '',
    obraSocialId: '',
    nroBeneficiario: '',
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.registerPaciente({
        usuario: form.usuario,
        contrasena: form.contrasena,
        nombrePaciente: form.nombrePaciente,
        dniPaciente: Number(form.dniPaciente),
        nroTelefonoPaciente: form.nroTelefonoPaciente || undefined,
        fechaNacimiento: form.fechaNacimiento,
        direccionPaciente: form.direccionPaciente || undefined,
        tipoPaciente: form.tipoPaciente,
        nroAfiliado: form.nroAfiliado ? Number(form.nroAfiliado) : undefined,
        obraSocialId: form.obraSocialId ? Number(form.obraSocialId) : undefined,
        nroBeneficiario: form.nroBeneficiario ? Number(form.nroBeneficiario) : undefined,
      });
      toast.success('¡Registro exitoso! Ya podés iniciar sesión.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orb auth-bg-orb--1" />
      <div className="auth-bg-orb auth-bg-orb--2" />

      <div className="auth-container auth-container--wide animate-fade-in">
        <div className="auth-brand">
          <div className="auth-logo"><FiActivity /></div>
          <h1 className="auth-title">Registro</h1>
          <p className="auth-subtitle">Crear cuenta de paciente</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form-grid">
            <div className="input-group">
              <label htmlFor="reg-nombre">Nombre Completo</label>
              <input id="reg-nombre" className="input-field" required
                value={form.nombrePaciente} onChange={(e) => update('nombrePaciente', e.target.value)} />
            </div>
            <div className="input-group">
              <label htmlFor="reg-dni">DNI</label>
              <input id="reg-dni" className="input-field" type="number" required
                value={form.dniPaciente} onChange={(e) => update('dniPaciente', e.target.value)} />
            </div>
          </div>

          <div className="auth-form-grid">
            <div className="input-group">
              <label htmlFor="reg-usuario">Usuario</label>
              <input id="reg-usuario" className="input-field" required
                value={form.usuario} onChange={(e) => update('usuario', e.target.value)} />
            </div>
            <div className="input-group">
              <label htmlFor="reg-contrasena">Contraseña</label>
              <input id="reg-contrasena" className="input-field" type="password" required
                value={form.contrasena} onChange={(e) => update('contrasena', e.target.value)} />
            </div>
          </div>

          <div className="auth-form-grid">
            <div className="input-group">
              <label htmlFor="reg-telefono">Teléfono</label>
              <input id="reg-telefono" className="input-field"
                value={form.nroTelefonoPaciente} onChange={(e) => update('nroTelefonoPaciente', e.target.value)} />
            </div>
            <div className="input-group">
              <label htmlFor="reg-nacimiento">Fecha de Nacimiento</label>
              <input id="reg-nacimiento" className="input-field" type="date" required
                value={form.fechaNacimiento} onChange={(e) => update('fechaNacimiento', e.target.value)} />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="reg-direccion">Dirección</label>
            <input id="reg-direccion" className="input-field"
              value={form.direccionPaciente} onChange={(e) => update('direccionPaciente', e.target.value)} />
          </div>

          <div className="input-group">
            <label htmlFor="reg-tipo">Tipo de Paciente</label>
            <select id="reg-tipo" className="input-field"
              value={form.tipoPaciente} onChange={(e) => update('tipoPaciente', e.target.value)}>
              <option value="PARTICULAR">Particular</option>
              <option value="OBRA_SOCIAL">Obra Social</option>
              <option value="PAMI">PAMI</option>
            </select>
          </div>

          {form.tipoPaciente === 'OBRA_SOCIAL' && (
            <div className="auth-form-grid">
              <div className="input-group">
                <label htmlFor="reg-afiliado">Nro. Afiliado</label>
                <input id="reg-afiliado" className="input-field" type="number"
                  value={form.nroAfiliado} onChange={(e) => update('nroAfiliado', e.target.value)} />
              </div>
              <div className="input-group">
                <label htmlFor="reg-os-id">ID Obra Social</label>
                <input id="reg-os-id" className="input-field" type="number"
                  value={form.obraSocialId} onChange={(e) => update('obraSocialId', e.target.value)} />
              </div>
            </div>
          )}

          {form.tipoPaciente === 'PAMI' && (
            <div className="input-group">
              <label htmlFor="reg-beneficiario">Nro. Beneficiario</label>
              <input id="reg-beneficiario" className="input-field" type="number"
                value={form.nroBeneficiario} onChange={(e) => update('nroBeneficiario', e.target.value)} />
            </div>
          )}

          <button id="reg-submit" type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            {loading ? 'Registrando...' : 'Crear Cuenta'}
            {!loading && <FiArrowRight />}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
        </p>
      </div>
    </div>
  );
}
