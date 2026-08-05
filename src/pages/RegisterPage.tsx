/* ============================================================
   SAGE — Register Page (Multi-actor self-registration)
   ============================================================ */
import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import type { TipoPaciente, Rol } from '../types';
import { FiActivity, FiArrowRight, FiUser, FiLock, FiShield, FiBriefcase, FiClipboard, FiUserCheck, FiHeart } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './AuthPages.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rolSeleccionado, setRolSeleccionado] = useState<Rol>('PACIENTE');

  // Form state
  const [form, setForm] = useState({
    usuario: '',
    contrasena: '',
    nombre: '',
    nroTelefono: '',
    // Campos Paciente
    dniPaciente: '',
    fechaNacimiento: '',
    direccionPaciente: '',
    tipoPaciente: 'PARTICULAR' as TipoPaciente,
    nroAfiliado: '',
    codObraSocial: 'OSDE',
    nroBeneficiario: '',
    // Campos Doctor
    codEspecialidad: 'CLINICA',
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (rolSeleccionado === 'PACIENTE') {
        await authApi.registerPaciente({
          usuario: form.usuario,
          contrasena: form.contrasena,
          nombrePaciente: form.nombre,
          dniPaciente: Number(form.dniPaciente),
          nroTelefonoPaciente: form.nroTelefono || undefined,
          fechaNacimiento: form.fechaNacimiento,
          direccionPaciente: form.direccionPaciente || undefined,
          tipoPaciente: form.tipoPaciente,
          nroAfiliado: form.nroAfiliado ? Number(form.nroAfiliado) : undefined,
          codObraSocial: form.tipoPaciente === 'OBRA_SOCIAL' ? form.codObraSocial : undefined,
          nroBeneficiario: form.nroBeneficiario ? Number(form.nroBeneficiario) : undefined,
        });
        toast.success('¡Paciente registrado exitosamente!');
      } else {
        await authApi.registerEmpleado({
          usuario: form.usuario,
          contrasena: form.contrasena,
          nombreEmpleado: form.nombre,
          rol: rolSeleccionado,
          nroTelefono: form.nroTelefono || undefined,
          codEspecialidad: rolSeleccionado === 'DOCTOR' ? form.codEspecialidad : undefined,
        });
        toast.success(`¡Actor (${rolSeleccionado}) registrado exitosamente!`);
      }

      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data || 'Error al registrar el actor');
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
          <button className="auth-tab auth-tab--active">Registrar Actor</button>
        </div>

        <div className="auth-brand">
          <div className="auth-logo"><FiActivity /></div>
          <h1 className="auth-title">Registro de Actor</h1>
          <p className="auth-subtitle">Seleccioná el rol e ingresá los datos</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="role-selector">
          <label className="input-group-label">Tipo de Actor a Registrar:</label>
          <div className="role-buttons">
            <button
              type="button"
              className={`role-btn ${rolSeleccionado === 'PACIENTE' ? 'role-btn--active' : ''}`}
              onClick={() => setRolSeleccionado('PACIENTE')}
            >
              <FiHeart /> Paciente
            </button>

            <button
              type="button"
              className={`role-btn ${rolSeleccionado === 'DOCTOR' ? 'role-btn--active' : ''}`}
              onClick={() => setRolSeleccionado('DOCTOR')}
            >
              <FiUserCheck /> Doctor
            </button>

            <button
              type="button"
              className={`role-btn ${rolSeleccionado === 'SECRETARIO' ? 'role-btn--active' : ''}`}
              onClick={() => setRolSeleccionado('SECRETARIO')}
            >
              <FiClipboard /> Secretario
            </button>

            <button
              type="button"
              className={`role-btn ${rolSeleccionado === 'ADMIN_CONSULTORIO' ? 'role-btn--active' : ''}`}
              onClick={() => setRolSeleccionado('ADMIN_CONSULTORIO')}
            >
              <FiBriefcase /> Admin Consultorio
            </button>

            <button
              type="button"
              className={`role-btn ${rolSeleccionado === 'ADMIN_GENERAL' ? 'role-btn--active' : ''}`}
              onClick={() => setRolSeleccionado('ADMIN_GENERAL')}
            >
              <FiShield /> Admin General
            </button>
          </div>
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
              <label htmlFor="reg-usuario">Usuario</label>
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

          {/* CAMPOS ESPECÍFICOS PARA PACIENTE */}
          {rolSeleccionado === 'PACIENTE' && (
            <>
              <div className="auth-form-grid">
                <div className="input-group">
                  <label htmlFor="reg-dni">DNI</label>
                  <input id="reg-dni" className="input-field" type="number" required
                    value={form.dniPaciente} onChange={(e) => update('dniPaciente', e.target.value)} />
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
                    <label htmlFor="reg-os-cod">Código Obra Social</label>
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
            </>
          )}

          {/* CAMPOS ESPECÍFICOS PARA DOCTOR */}
          {rolSeleccionado === 'DOCTOR' && (
            <div className="input-group">
              <label htmlFor="reg-especialidad">Especialidad Médica</label>
              <select id="reg-especialidad" className="input-field"
                value={form.codEspecialidad} onChange={(e) => update('codEspecialidad', e.target.value)}>
                <option value="CLINICA">Clínica General</option>
                <option value="CARDIO">Cardiología</option>
                <option value="PEDIATRIA">Pediatría</option>
              </select>
            </div>
          )}

          <button id="reg-submit" type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            {loading ? 'Registrando Actor...' : `Registrar como ${rolSeleccionado}`}
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
