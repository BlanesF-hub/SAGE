import { useState } from 'react';
import { consultorioAdminApi } from '../services/api';
import { FiUsers, FiPlus, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ConsultorioAdminDashboard() {
  const [roleType, setRoleType] = useState<'DOCTOR' | 'SECRETARIO'>('DOCTOR');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [usuario, setUsuario] = useState('');
  const [nombreEmpleado, setNombreEmpleado] = useState('');
  const [nroTelefono, setNroTelefono] = useState('');
  const [codPersonal, setCodPersonal] = useState(''); // codDoctor or codSecretario

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (roleType === 'DOCTOR') {
        await consultorioAdminApi.crearDoctor({
          usuario,
          nombreEmpleado,
          nroTelefono: nroTelefono || undefined,
          codDoctor: codPersonal,
        });
        toast.success('Médico creado exitosamente con contraseña provisional "sage123"');
      } else {
        await consultorioAdminApi.crearSecretario({
          usuario,
          nombreEmpleado,
          nroTelefono: nroTelefono || undefined,
          codSecretario: codPersonal,
        });
        toast.success('Secretario creado exitosamente con contraseña provisional "sage123"');
      }
      setModalOpen(false);
      // Reset form
      setUsuario('');
      setNombreEmpleado('');
      setNroTelefono('');
      setCodPersonal('');
    } catch (err: any) {
      toast.error(err.response?.data || 'Error al crear personal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Administración del Consultorio</h1>
          <p className="page-subtitle">Gestión y registro de médicos, secretarios y personal clínico</p>
        </div>
        <button id="btn-add-staff" className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <FiPlus /> Registrar Personal
        </button>
      </div>

      <div className="card">
        <div className="empty-state">
          <FiUsers className="empty-state-icon" />
          <h3 className="empty-state-title">Gestión de Personal Clínico</h3>
          <p className="empty-state-desc">
            Use el botón "Registrar Personal" para agregar médicos o secretarios a la clínica.
          </p>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card-glass">
            <h2 className="modal-title">Registrar Nuevo Empleado</h2>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="input-group">
                <label htmlFor="staff-role">Rol / Cargo</label>
                <select
                  id="staff-role"
                  className="input-field"
                  value={roleType}
                  onChange={(e) => setRoleType(e.target.value as 'DOCTOR' | 'SECRETARIO')}
                  required
                >
                  <option value="DOCTOR">Médico / Doctor</option>
                  <option value="SECRETARIO">Secretario / Administrativo</option>
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="staff-name">Nombre Completo</label>
                <input
                  id="staff-name"
                  className="input-field"
                  value={nombreEmpleado}
                  onChange={(e) => setNombreEmpleado(e.target.value)}
                  placeholder="Ej: Dr. Juan Pérez o Ana Gómez"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="staff-usr">Nombre de Usuario</label>
                <input
                  id="staff-usr"
                  className="input-field"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Ej: jperez"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="staff-cod">Código Identificador (Matrícula / Cód. Empleado)</label>
                <input
                  id="staff-cod"
                  className="input-field"
                  value={codPersonal}
                  onChange={(e) => setCodPersonal(e.target.value)}
                  placeholder={roleType === 'DOCTOR' ? 'Ej: MAT-4592' : 'Ej: SEC-1002'}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="staff-tel">Teléfono de contacto</label>
                <input
                  id="staff-tel"
                  className="input-field"
                  value={nroTelefono}
                  onChange={(e) => setNroTelefono(e.target.value)}
                  placeholder="Ej: +54 9 261 1234567"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Guardando...' : 'Registrar Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
