/* ============================================================
   SAGE — Register Page (Pacientes únicamente)
   ============================================================ */
import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import type { TipoPaciente } from '../types';
import { FiActivity, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './AuthPages.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    usuario: '',
    contrasena: '',
    nombre: '',
    nroTelefono: '',
    dniPaciente: '',
    edad: '',
    fechaNacimiento: '',
    direccionPaciente: '',
    tipoPaciente: 'PARTICULAR' as TipoPaciente,
    nroAfiliado: '',
    codObraSocial: 'OSDE',
    nroBeneficiario: '',
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const edadNum = Number(form.edad);
      const calcBirth = form.fechaNacimiento || `${new Date().getFullYear() - edadNum}-01-01`;
      await authApi.registerPaciente({
        usuario: form.usuario,
        contrasena: form.contrasena,
        nombrePaciente: form.nombre,
        dniPaciente: Number(form.dniPaciente),
        nroTelefonoPaciente: form.nroTelefono || undefined,
        edad: edadNum,
        fechaNacimiento: calcBirth,
        direccionPaciente: form.direccionPaciente || undefined,
        tipoPaciente: form.tipoPaciente,
        nroAfiliado: form.nroAfiliado ? Number(form.nroAfiliado) : undefined,
        codObraSocial: form.tipoPaciente === 'OBRA_SOCIAL' ? form.codObraSocial : undefined,
        nroBeneficiario: form.nroBeneficiario ? Number(form.nroBeneficiario) : undefined,
      });
      toast.success('¡Cuenta creada exitosamente! Bienvenido/a.');
      // Auto-login: cargar los datos del paciente recién registrado y entrar directo
      const loginData = await authApi.login({ usuario: form.usuario, contrasena: form.contrasena });
      login(loginData);
      navigate('/');

    } catch (err: any) {
      toast.error(err?.message || err?.response?.data || 'Error al registrar el paciente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orb auth-bg-orb--1" />
      <div className="auth-bg-orb auth-bg-orb--2" />

      <div className="auth-container auth-container--wide animate-fade-in">
        <div className="auth-nav-tabs">
          <Link to="/login" className="auth-tab">Iniciar Sesión</Link>
          <button className="auth-tab auth-tab--active">Registrar Paciente</button>
        </div>

        <div className="auth-brand">
          <div className="auth-logo"><FiActivity /></div>
          <h1 className="auth-title">Registro de Paciente</h1>
          <p className="auth-subtitle">Completá tus datos para sacar turnos</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form-grid">
            <div className="input-group">
              <label htmlFor="reg-nombre">Nombre Completo</label>
              <input id="reg-nombre" className="input-field" required
                value={form.nombre} onChange={(e) => update('nombre', e.target.value)}
                placeholder="Ej. Juan Pérez" />
            </div>
            <div className="input-group">
              <label htmlFor="reg-usuario">Nombre de Usuario</label>
              <input id="reg-usuario" className="input-field" required
                value={form.usuario} onChange={(e) => update('usuario', e.target.value)}
                placeholder="Ej. jperez" />
            </div>
          </div>

          <div className="auth-form-grid">
            <div className="input-group">
              <label htmlFor="reg-contrasena">Contraseña</label>
              <input id="reg-contrasena" className="input-field" type="password" required
                value={form.contrasena} onChange={(e) => update('contrasena', e.target.value)} />
            </div>
            <div className="input-group">
              <label htmlFor="reg-telefono">Teléfono</label>
              <input id="reg-telefono" className="input-field"
                value={form.nroTelefono} onChange={(e) => update('nroTelefono', e.target.value)}
                placeholder="Ej. 351-5551234" />
            </div>
          </div>

          <div className="auth-form-grid">
            <div className="input-group">
              <label htmlFor="reg-dni">DNI</label>
              <input id="reg-dni" className="input-field" type="number" required
                value={form.dniPaciente} onChange={(e) => update('dniPaciente', e.target.value)} />
            </div>
            <div className="input-group">
              <label htmlFor="reg-edad">Edad (años)</label>
              <input id="reg-edad" className="input-field" type="number" min="0" max="120" required
                value={form.edad} onChange={(e) => {
                  const val = e.target.value;
                  update('edad', val);
                  if (val) {
                    const birthYear = new Date().getFullYear() - Number(val);
                    update('fechaNacimiento', `${birthYear}-05-15`);
                  }
                }}
                placeholder="Ej. 50" />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="reg-direccion">Dirección</label>
            <input id="reg-direccion" className="input-field"
              value={form.direccionPaciente} onChange={(e) => update('direccionPaciente', e.target.value)}
              placeholder="Ej. Av. Colón 123" />
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
                <label htmlFor="reg-os-cod">Obra Social</label>
                <select id="reg-os-cod" className="input-field"
                  value={form.codObraSocial} onChange={(e) => update('codObraSocial', e.target.value)}>
                  <option value="OSDE">OSDE 210</option>
                  <option value="SWISS">Swiss Medical</option>
                  <option value="PAMI_OS">PAMI Instituto</option>
                </select>
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
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            {!loading && <FiArrowRight />}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión aquí</Link>
        </p>
      </div>
    </div>
  );
}
