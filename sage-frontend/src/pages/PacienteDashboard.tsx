import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi, doctorApi, turnoApi, agendaApi } from '../services/api';
import type { Turno, Doctor, Consultorio } from '../types';
import { FiCalendar, FiPlus, FiClock, FiTrash2, FiUser, FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function PacienteDashboard() {
  const { user } = useAuth();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedConsultorio, setSelectedConsultorio] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedFecha, setSelectedFecha] = useState('');
  const [selectedHora, setSelectedHora] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTurnos();
    fetchConsultorios();
  }, []);

  useEffect(() => {
    if (selectedConsultorio) {
      doctorApi.listarPorConsultorio(Number(selectedConsultorio))
        .then(setDoctores)
        .catch(() => toast.error('Error al cargar doctores'));
    } else {
      setDoctores([]);
    }
    setSelectedDoctor('');
    setSlots([]);
  }, [selectedConsultorio]);

  useEffect(() => {
    if (selectedDoctor && selectedFecha) {
      agendaApi.getSlotsDisponibles(Number(selectedDoctor), selectedFecha)
        .then(setSlots)
        .catch(() => toast.error('Error al cargar horarios disponibles'));
    } else {
      setSlots([]);
    }
    setSelectedHora('');
  }, [selectedDoctor, selectedFecha]);

  const fetchTurnos = async () => {
    try {
      // Stub for patient's personal turno list
      // In production, this would be api.get(`/api/turnos/paciente/${user.id}`)
      setLoading(false);
    } catch {
      toast.error('Error al cargar turnos');
    }
  };

  const fetchConsultorios = async () => {
    try {
      const data = await adminApi.getConsultorios();
      setConsultorios(data);
    } catch {
      toast.error('Error al cargar consultorios');
    }
  };

  const handleSolicitar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const fechaHora = `${selectedFecha}T${selectedHora}:00`;
      const nuevoTurno = await turnoApi.solicitar({
        pacienteId: user.id,
        doctorId: Number(selectedDoctor),
        fechaHora,
        descripcion,
      });
      setTurnos((prev) => [nuevoTurno, ...prev]);
      toast.success('Turno solicitado exitosamente. Le llegará una confirmación por WhatsApp.');
      setModalOpen(false);
      // Reset form
      setSelectedConsultorio('');
      setSelectedDoctor('');
      setSelectedFecha('');
      setSelectedHora('');
      setDescripcion('');
    } catch (err: any) {
      toast.error(err.response?.data || 'Error al solicitar el turno');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmar = async (id: number) => {
    try {
      await turnoApi.confirmar(id);
      setTurnos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, confirmado: true, estado: 'CONFIRMADO' } : t))
      );
      toast.success('Turno confirmado exitosamente');
    } catch (err: any) {
      toast.error(err.response?.data || 'Error al confirmar turno');
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mis Turnos</h1>
          <p className="page-subtitle">Gestioná tus citas médicas y solicitá nuevos turnos</p>
        </div>
        <button id="btn-nuevo-turno" className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <FiPlus /> Solicitar Turno
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="skeleton" style={{ height: '200px' }} />
        ) : turnos.length === 0 ? (
          <div className="empty-state">
            <FiCalendar className="empty-state-icon" />
            <h3 className="empty-state-title">No tenés turnos programados</h3>
            <p className="empty-state-desc">Hacé click en "Solicitar Turno" para programar tu primera consulta médica.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Doctor</th>
                  <th>Especialidad</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {turnos.map((turno) => (
                  <tr key={turno.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FiClock style={{ color: 'var(--color-primary)' }} />
                        {new Date(turno.fechaHoraPlanificado).toLocaleString('es-AR', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </div>
                    </td>
                    <td>{turno.doctor.nombreEmpleado}</td>
                    <td>{turno.doctor.especialidad?.nombreEspecialidad || 'General'}</td>
                    <td>
                      <span className={`badge badge-${
                        turno.estado === 'CONFIRMADO' ? 'success' :
                        turno.estado === 'ASIGNADO' || turno.estado === 'REASIGNADO' ? 'warning' : 'primary'
                      }`}>
                        {turno.estado}
                      </span>
                    </td>
                    <td>
                      {(turno.estado === 'ASIGNADO' || turno.estado === 'REASIGNADO') && !turno.confirmado && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleConfirmar(turno.id)}
                        >
                          Confirmar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card-glass">
            <h2 className="modal-title">Nuevo Turno Médico</h2>
            <form onSubmit={handleSolicitar} className="auth-form">
              <div className="input-group">
                <label htmlFor="st-consultorio">Consultorio</label>
                <select
                  id="st-consultorio"
                  className="input-field"
                  value={selectedConsultorio}
                  onChange={(e) => setSelectedConsultorio(e.target.value)}
                  required
                >
                  <option value="">Seleccione consultorio</option>
                  {consultorios.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombreConsultorio}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="st-doctor">Médico / Especialista</label>
                <select
                  id="st-doctor"
                  className="input-field"
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  disabled={!selectedConsultorio}
                  required
                >
                  <option value="">Seleccione médico</option>
                  {doctores.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nombreEmpleado} ({d.especialidad?.nombreEspecialidad || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label htmlFor="st-fecha">Fecha</label>
                  <input
                    id="st-fecha"
                    type="date"
                    className="input-field"
                    value={selectedFecha}
                    onChange={(e) => setSelectedFecha(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    disabled={!selectedDoctor}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="st-hora">Horario disponible</label>
                  <select
                    id="st-hora"
                    className="input-field"
                    value={selectedHora}
                    onChange={(e) => setSelectedHora(e.target.value)}
                    disabled={!selectedFecha || slots.length === 0}
                    required
                  >
                    <option value="">Seleccione hora</option>
                    {slots.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="st-desc">Motivo de consulta</label>
                <textarea
                  id="st-desc"
                  className="input-field"
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Control de rutina, dolor persistente, etc."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Solicitando...' : 'Confirmar Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
