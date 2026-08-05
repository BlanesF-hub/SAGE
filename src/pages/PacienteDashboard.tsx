import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../services/api';
import type { Consultorio } from '../types';
import { FiCalendar, FiPlus, FiClock } from 'react-icons/fi';
import CustomCalendar from '../components/CustomCalendar';
import toast from 'react-hot-toast';

// Helpers para leer desde el localStorage mock
const getLocal = <T,>(key: string): T[] => JSON.parse(localStorage.getItem(key) || '[]');

export default function PacienteDashboard() {
  const { user } = useAuth();
  const [turnos, setTurnos] = useState<any[]>([]);
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Flujo de selección: Consultorio → Especialidad → Médico → Fecha/Hora
  const [selectedConsultorioId, setSelectedConsultorioId] = useState('');
  const [selectedEspecialidad, setSelectedEspecialidad] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedFecha, setSelectedFecha] = useState('');
  const [selectedHora, setSelectedHora] = useState('');
  const [descripcion, setDescripcion] = useState('');

  useEffect(() => {
    fetchConsultorios();
    // Cargar turnos mock del paciente
    const mockTurnos = getLocal<any>('mock_turnos_paciente').filter(
      (t: any) => t.pacienteId === user?.id
    );
    setTurnos(mockTurnos);
    setLoading(false);
  }, []);

  const fetchConsultorios = async () => {
    try {
      const data = await adminApi.getConsultorios();
      setConsultorios(data);
    } catch {
      toast.error('Error al cargar consultorios');
    }
  };

  // Todos los doctores del localStorage
  const allDoctores = useMemo(() => getLocal<any>('mock_doctores'), [modalOpen]);

  // Doctores del consultorio seleccionado (tienen agenda asignada con salaId en ese consultorio)
  const doctoresDelConsultorio = useMemo(() => {
    if (!selectedConsultorioId) return [];
    // Las salas pertenecen a un consultorio
    const salas = getLocal<any>('mock_salas').filter(
      (s: any) => String(s.consultorioId) === String(selectedConsultorioId)
    );
    const salaIds = salas.map((s: any) => s.id);
    // Un médico pertenece al consultorio si tiene agenda en alguna de sus salas
    return allDoctores.filter((d: any) => {
      const agenda = d.configuracion?.agenda || [];
      return agenda.some((a: any) => salaIds.includes(Number(a.salaId)));
    });
  }, [selectedConsultorioId, allDoctores]);

  // Helper para resolver el nombre legible de una especialidad a partir de su código o ID
  const resolveEspecialidadNombre = (codOrName: string) => {
    if (!codOrName) return '-';
    const mockEsp = getLocal<any>('mock_especialidades');
    const found = mockEsp.find(
      (e: any) => String(e.codEspecialidad) === String(codOrName) || String(e.id) === String(codOrName)
    );
    return found?.nombreEspecialidad || codOrName;
  };

  // Especialidades únicas de los médicos del consultorio (con nombre legible)
  const especialidades = useMemo(() => {
    const map = new Map<string, string>();
    doctoresDelConsultorio.forEach((d: any) => {
      const cod = d.configuracion?.codEspecialidad || d.codEspecialidad;
      if (cod && !map.has(cod)) {
        map.set(cod, resolveEspecialidadNombre(cod));
      }
    });
    return Array.from(map.entries()).map(([cod, nombre]) => ({ cod, nombre }));
  }, [doctoresDelConsultorio]);

  // Médicos filtrados por especialidad seleccionada
  const doctoresFiltrados = useMemo(() => {
    if (!selectedEspecialidad) return doctoresDelConsultorio;
    return doctoresDelConsultorio.filter((d: any) => {
      const esp = d.configuracion?.codEspecialidad || d.codEspecialidad;
      return esp === selectedEspecialidad;
    });
  }, [selectedEspecialidad, doctoresDelConsultorio]);

  // Días de la semana en los que atiende el médico seleccionado (1=Lun...7=Dom)
  const diasQueAtiende = useMemo(() => {
    if (!selectedDoctorId) return new Set<number>();
    const doctor = allDoctores.find((d: any) => String(d.id) === String(selectedDoctorId));
    const agenda = doctor?.configuracion?.agenda || [];
    return new Set<number>(agenda.map((a: any) => Number(a.diaSemana)));
  }, [selectedDoctorId, allDoctores]);

  // Horarios disponibles: slots de 30 min del médico para la fecha, sin solapamientos
  const horariosDisponibles = useMemo(() => {
    if (!selectedDoctorId || !selectedFecha) return [];
    const doctor = allDoctores.find((d: any) => String(d.id) === String(selectedDoctorId));
    if (!doctor) return [];
    const agenda = doctor.configuracion?.agenda || [];
    const fecha = new Date(selectedFecha + 'T00:00:00');
    const diaSemana = fecha.getDay() === 0 ? 7 : fecha.getDay();
    const turnosDia = agenda.filter((a: any) => Number(a.diaSemana) === diaSemana);
    if (turnosDia.length === 0) return [];

    // Turnos ya reservados en esta fecha (médico u ocupados por el mismo paciente)
    const mockTurnos = getLocal<any>('mock_turnos_paciente');
    const turnosDoctorExistentes = mockTurnos.filter(
      (t: any) => String(t.doctorId) === String(selectedDoctorId) &&
                  t.estado !== 'CANCELADO' &&
                  t.fechaHoraPlanificado?.startsWith(selectedFecha)
    );
    const turnosPacienteExistentes = mockTurnos.filter(
      (t: any) => t.pacienteId === user?.id &&
                  t.estado !== 'CANCELADO' &&
                  t.fechaHoraPlanificado?.startsWith(selectedFecha)
    );

    const horasOcupadas = new Set([
      ...turnosDoctorExistentes.map((t: any) => t.fechaHoraPlanificado?.substring(11, 16)),
      ...turnosPacienteExistentes.map((t: any) => t.fechaHoraPlanificado?.substring(11, 16)),
    ]);

    // Generar slots de 30 min
    const slots: string[] = [];
    for (const bloque of turnosDia) {
      const [hIni, mIni] = bloque.horaInicio.split(':').map(Number);
      const [hFin, mFin] = bloque.horaFin.split(':').map(Number);
      let cur = hIni * 60 + mIni;
      const end = hFin * 60 + mFin;
      while (cur + 30 <= end) {
        const h = String(Math.floor(cur / 60)).padStart(2, '0');
        const m = String(cur % 60).padStart(2, '0');
        const slot = `${h}:${m}`;
        if (!horasOcupadas.has(slot)) slots.push(slot);
        cur += 30;
      }
    }
    return slots;
  }, [selectedDoctorId, selectedFecha, allDoctores, user]);

  const resetForm = () => {
    setSelectedConsultorioId('');
    setSelectedEspecialidad('');
    setSelectedDoctorId('');
    setSelectedFecha('');
    setSelectedHora('');
    setDescripcion('');
  };

  const handleSolicitar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const doctor = allDoctores.find((d: any) => String(d.id) === String(selectedDoctorId));
      const consultorio = consultorios.find((c) => String(c.id) === String(selectedConsultorioId));
      const espNombre = resolveEspecialidadNombre(selectedEspecialidad);

      const storedTurnos = getLocal<any>('mock_turnos_paciente').filter(
        (t: any) => t.pacienteId === user.id && t.estado !== 'CANCELADO'
      );

      // Regla 1: Un paciente no puede tener más de un turno para la misma especialidad en estado PENDIENTE
      const tienePendienteMismaEsp = storedTurnos.some((t: any) => {
        if (t.estado !== 'PENDIENTE') return false;
        const espTurno = t.doctor?.especialidad?.codEspecialidad || t.doctor?.especialidad?.nombreEspecialidad;
        const espNombreTurno = resolveEspecialidadNombre(espTurno);
        return (
          espTurno === selectedEspecialidad ||
          espNombreTurno === espNombre ||
          espTurno === espNombre
        );
      });

      if (tienePendienteMismaEsp) {
        toast.error(`Ya tenés un turno en estado PENDIENTE para la especialidad "${espNombre}".`);
        setSubmitting(false);
        return;
      }

      // Regla 2: Si tiene turnos de distintas especialidades, no pueden solaparse los horarios
      const fechaHoraNuevaInicio = new Date(`${selectedFecha}T${selectedHora}:00`).getTime();
      const fechaHoraNuevaFin = fechaHoraNuevaInicio + 30 * 60 * 1000;

      const tieneSolapamiento = storedTurnos.some((t: any) => {
        const inicioExistente = new Date(t.fechaHoraPlanificado).getTime();
        const finExistente = inicioExistente + 30 * 60 * 1000;
        return fechaHoraNuevaInicio < finExistente && fechaHoraNuevaFin > inicioExistente;
      });

      if (tieneSolapamiento) {
        toast.error('El horario seleccionado se solapa con otro turno que ya tenés reservado.');
        setSubmitting(false);
        return;
      }

      const nuevoTurno: any = {
        id: Date.now(),
        pacienteId: user.id,
        doctorId: Number(selectedDoctorId),
        doctor: {
          id: Number(selectedDoctorId),
          nombreEmpleado: doctor?.nombreEmpleado || 'Dr.',
          especialidad: { codEspecialidad: selectedEspecialidad, nombreEspecialidad: espNombre },
        },
        consultorio: { nombreConsultorio: consultorio?.nombreConsultorio || '' },
        fechaHoraPlanificado: `${selectedFecha}T${selectedHora}:00`,
        estado: 'PENDIENTE',
        confirmado: false,
        descripcion,
      };
      // Guardar en mock
      const stored = getLocal<any>('mock_turnos_paciente');
      stored.push(nuevoTurno);
      localStorage.setItem('mock_turnos_paciente', JSON.stringify(stored));
      setTurnos((prev) => [nuevoTurno, ...prev]);
      toast.success('¡Turno solicitado exitosamente!');
      setModalOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err?.response?.data || 'Error al solicitar el turno');
    } finally {
      setSubmitting(false);
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
                  <th>Consultorio</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {turnos.map((turno: any) => (
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
                    <td>{turno.doctor?.nombreEmpleado}</td>
                    <td>{resolveEspecialidadNombre(turno.doctor?.especialidad?.nombreEspecialidad || turno.doctor?.especialidad?.codEspecialidad)}</td>
                    <td>{turno.consultorio?.nombreConsultorio}</td>
                    <td>
                      <span className={`badge badge-${turno.estado === 'CONFIRMADO' ? 'success' : turno.estado === 'PENDIENTE' ? 'warning' : 'primary'}`}>
                        {turno.estado}
                      </span>
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
            <h2 className="modal-title">Solicitar Turno Médico</h2>
            <form onSubmit={handleSolicitar} className="auth-form">

              {/* PASO 1: Consultorio */}
              <div className="input-group">
                <label htmlFor="st-consultorio">1. Consultorio</label>
                <select
                  id="st-consultorio"
                  className="input-field"
                  value={selectedConsultorioId}
                  onChange={(e) => {
                    setSelectedConsultorioId(e.target.value);
                    setSelectedEspecialidad('');
                    setSelectedDoctorId('');
                    setSelectedFecha('');
                    setSelectedHora('');
                  }}
                  required
                >
                  <option value="">Seleccioná un consultorio</option>
                  {consultorios.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombreConsultorio}</option>
                  ))}
                </select>
              </div>

              {/* PASO 2: Especialidad (solo si hay consultorio y médicos) */}
              {selectedConsultorioId && (
                <div className="input-group">
                  <label htmlFor="st-especialidad">2. Especialidad</label>
                  {especialidades.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      No hay médicos con agenda asignada en este consultorio aún.
                    </p>
                  ) : (
                    <select
                      id="st-especialidad"
                      className="input-field"
                      value={selectedEspecialidad}
                      onChange={(e) => {
                        setSelectedEspecialidad(e.target.value);
                        setSelectedDoctorId('');
                        setSelectedFecha('');
                        setSelectedHora('');
                      }}
                      required
                    >
                      <option value="">Seleccioná una especialidad</option>
                      {especialidades.map(({ cod, nombre }) => (
                        <option key={cod} value={cod}>{nombre}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* PASO 3: Médico filtrado */}
              {selectedEspecialidad && (
                <div className="input-group">
                  <label htmlFor="st-doctor">3. Médico</label>
                  <select
                    id="st-doctor"
                    className="input-field"
                    value={selectedDoctorId}
                    onChange={(e) => {
                      setSelectedDoctorId(e.target.value);
                      setSelectedFecha('');
                      setSelectedHora('');
                    }}
                    required
                  >
                    <option value="">Seleccioná un médico</option>
                    {doctoresFiltrados.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.nombreEmpleado}</option>
                    ))}
                  </select>

                  {/* PASO 4: Calendario visual */}
                  {selectedDoctorId && (
                    <div className="input-group">
                      <label>4. Seleccioná la fecha</label>
                      <CustomCalendar
                        diasDisponibles={diasQueAtiende}
                        selectedDate={selectedFecha}
                        onChange={(date) => { setSelectedFecha(date); setSelectedHora(''); }}
                      />
                      {selectedFecha && horariosDisponibles.length === 0 && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '8px' }}>
                          No hay horarios disponibles (todos ocupados).
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* PASO 5: Hora */}
              {selectedFecha && horariosDisponibles.length > 0 && (
                <div className="input-group">
                  <label htmlFor="st-hora">5. Horario disponible</label>
                  <select
                    id="st-hora"
                    className="input-field"
                    value={selectedHora}
                    onChange={(e) => setSelectedHora(e.target.value)}
                    required
                  >
                    <option value="">Seleccioná un horario</option>
                    {horariosDisponibles.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Motivo */}
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
                <button type="button" className="btn btn-secondary" onClick={() => { setModalOpen(false); resetForm(); }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting || !selectedHora}>
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
