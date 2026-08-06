import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi, doctorApi, turnoApi, consultaApi, consultorioAdminApi } from '../services/api';
import type { Turno, Doctor, Consultorio, Paciente } from '../types';
import { FiCalendar, FiPlus, FiClock, FiCheck, FiAlertTriangle, FiUser, FiNavigation } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function SecretarioDashboard() {
  const { user } = useAuth();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [urgenciaOpen, setUrgenciaOpen] = useState(false);
  const [reasignarOpen, setReasignarOpen] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);

  // Form states
  const [pacienteId, setPacienteId] = useState('');
  const [urgenciaDoctorId, setUrgenciaDoctorId] = useState('');
  const [urgenciaDesc, setUrgenciaDesc] = useState('');
  const [nuevaFechaHora, setNuevaFechaHora] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDoctores();
  }, []);

  useEffect(() => {
    fetchTurnos();
  }, [selectedDoctor, fecha]);

  const fetchDoctores = async () => {
    try {
      const data = await consultorioAdminApi.getDoctores();
      setDoctores(data);
    } catch {
      toast.error('Error al cargar doctores');
    }
  };

  const fetchTurnos = async () => {
    setLoading(true);
    try {
      const allTurnos = JSON.parse(localStorage.getItem('mock_turnos_paciente') || '[]');
      const allPacientes = JSON.parse(localStorage.getItem('mock_pacientes') || '[]');
      
      let filtered = allTurnos.filter((t: any) => t.fechaHoraPlanificado?.startsWith(fecha));
      if (selectedDoctor) {
        filtered = filtered.filter((t: any) => String(t.doctorId) === String(selectedDoctor));
      }

      const enriched = filtered.map((t: any) => {
        const pac = allPacientes.find((p: any) => p.id === t.pacienteId);
        return {
          ...t,
          pacienteNombre: pac?.nombrePaciente || t.doctor?.nombrePaciente || 'Paciente',
          pacienteDni: pac?.dniPaciente || '-',
          pacienteTel: pac?.nroTelefonoPaciente || pac?.nroTelefono || '-',
        };
      });

      setTurnos(enriched);
      setLoading(false);
    } catch {
      toast.error('Error al cargar turnos');
      setLoading(false);
    }
  };

  const handleMarcarPresente = (turnoId: number) => {
    const allTurnos = JSON.parse(localStorage.getItem('mock_turnos_paciente') || '[]');
    const idx = allTurnos.findIndex((t: any) => t.id === turnoId);
    if (idx !== -1) {
      allTurnos[idx].estado = 'PRESENTE';
      allTurnos[idx].confirmado = true;
      localStorage.setItem('mock_turnos_paciente', JSON.stringify(allTurnos));
      toast.success('Paciente marcado como PRESENTE. Notificado al médico.');
      fetchTurnos();
    }
  };

  const handleIngresarUrgencia = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await consultaApi.ingresarUrgencia(
        Number(pacienteId),
        Number(urgenciaDoctorId),
        urgenciaDesc
      );
      toast.success('Urgencia ingresada exitosamente. Notificado al médico.');
      setUrgenciaOpen(false);
      setPacienteId('');
      setUrgenciaDoctorId('');
      setUrgenciaDesc('');
      fetchTurnos();
    } catch (err: any) {
      toast.error(err.response?.data || 'Error al ingresar urgencia');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReasignar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTurno) return;
    setSubmitting(true);
    try {
      await turnoApi.reasignar(selectedTurno.id, nuevaFechaHora);
      toast.success('Turno reasignado con éxito. Se envió notificación al paciente.');
      setReasignarOpen(false);
      setSelectedTurno(null);
      setNuevaFechaHora('');
      fetchTurnos();
    } catch (err: any) {
      toast.error(err.response?.data || 'Error al reasignar turno');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Agenda del Consultorio</h1>
          <p className="page-subtitle">Gestioná admisiones, check-ins de pacientes y urgencias médicas</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button id="btn-urgencia" className="btn btn-danger" onClick={() => setUrgenciaOpen(true)}>
            <FiAlertTriangle /> Ingresar Urgencia
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
          <label htmlFor="filter-doctor">Filtrar por Médico</label>
          <select
            id="filter-doctor"
            className="input-field"
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
          >
            <option value="">Todos los médicos</option>
            {doctores.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombreEmpleado}
              </option>
            ))}
          </select>
        </div>
        <div className="input-group" style={{ width: '180px' }}>
          <label htmlFor="filter-fecha">Fecha</label>
          <input
            id="filter-fecha"
            type="date"
            className="input-field"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="skeleton" style={{ height: '200px' }} />
        ) : turnos.length === 0 ? (
          <div className="empty-state">
            <FiCalendar className="empty-state-icon" />
            <h3 className="empty-state-title">No hay turnos para este día</h3>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Paciente</th>
                  <th>DNI</th>
                  <th>Teléfono</th>
                  <th>Médico</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {turnos.map((turno: any) => (
                  <tr key={turno.id}>
                    <td>{new Date(turno.fechaHoraPlanificado).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{turno.pacienteNombre}</td>
                    <td>{turno.pacienteDni}</td>
                    <td>{turno.pacienteTel}</td>
                    <td>{turno.doctor?.nombreEmpleado || 'Dr.'}</td>
                    <td>{turno.descripcion || 'Sin motivo'}</td>
                    <td>
                      {turno.estado === 'CANCELADO' ? (
                        <span className="badge badge-danger">CANCELADO (Sobreturno)</span>
                      ) : turno.estado === 'PRESENTE' ? (
                        <span className="badge badge-success">PRESENTE</span>
                      ) : (
                        <span className="badge badge-warning">{turno.estado}</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {turno.estado !== 'PRESENTE' && turno.estado !== 'CANCELADO' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleMarcarPresente(turno.id)}
                            title="Marcar presente"
                          >
                            <FiCheck /> Marcar Presente
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Urgencia */}
      {urgenciaOpen && (
        <div className="modal-overlay">
          <div className="modal-content card-glass">
            <h2 className="modal-title" style={{ color: 'var(--color-danger)' }}>Ingresar Urgencia Médica</h2>
            <form onSubmit={handleIngresarUrgencia} className="auth-form">
              <div className="input-group">
                <label htmlFor="urg-paciente">ID Paciente</label>
                <input
                  id="urg-paciente"
                  className="input-field"
                  type="number"
                  placeholder="Ingrese el ID del paciente"
                  value={pacienteId}
                  onChange={(e) => setPacienteId(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="urg-doctor">Asignar Médico de Guardia</label>
                <select
                  id="urg-doctor"
                  className="input-field"
                  value={urgenciaDoctorId}
                  onChange={(e) => setUrgenciaDoctorId(e.target.value)}
                  required
                >
                  <option value="">Seleccione médico</option>
                  {doctores.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nombreEmpleado}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="urg-desc">Observaciones / Síntomas iniciales</label>
                <textarea
                  id="urg-desc"
                  className="input-field"
                  rows={3}
                  value={urgenciaDesc}
                  onChange={(e) => setUrgenciaDesc(e.target.value)}
                  placeholder="Ej: Fuerte dolor abdominal, presión alta, etc."
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setUrgenciaOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-danger" disabled={submitting}>
                  {submitting ? 'Registrando...' : 'Ingresar de Inmediato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reasignar */}
      {reasignarOpen && selectedTurno && (
        <div className="modal-overlay">
          <div className="modal-content card-glass">
            <h2 className="modal-title">Reasignar Turno</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Reasignando turno de {selectedTurno.paciente?.nombrePaciente} con el Dr. {selectedTurno.doctor.nombreEmpleado}
            </p>
            <form onSubmit={handleReasignar} className="auth-form">
              <div className="input-group">
                <label htmlFor="reasignar-fecha">Nueva Fecha y Hora</label>
                <input
                  id="reasignar-fecha"
                  type="datetime-local"
                  className="input-field"
                  value={nuevaFechaHora}
                  onChange={(e) => setNuevaFechaHora(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setReasignarOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Guardando...' : 'Reasignar Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
