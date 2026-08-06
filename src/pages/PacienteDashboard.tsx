import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi, turnoSupabaseApi } from '../services/api';
import type { Consultorio } from '../types';
import { FiCalendar, FiPlus, FiClock } from 'react-icons/fi';
import CustomCalendar from '../components/CustomCalendar';
import toast from 'react-hot-toast';

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

  const [allDoctoresState, setAllDoctoresState] = useState<any[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const fetchInitialData = async () => {
    try {
      const [cons, docs, misTurnos] = await Promise.all([
        adminApi.getConsultorios(),
        turnoSupabaseApi.getDoctoresTodos(),
        user?.id ? turnoSupabaseApi.getTurnosByPaciente(user.id) : Promise.resolve([]),
      ]);
      setConsultorios(cons);
      setAllDoctoresState(docs);
      setTurnos(misTurnos);
    } catch (err) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
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

  // Todos los doctores (Supabase)
  const allDoctores = useMemo(() => allDoctoresState, [allDoctoresState, modalOpen]);

  // Doctores del consultorio seleccionado
  const doctoresDelConsultorio = useMemo(() => {
    if (!selectedConsultorioId) return [];
    // Filtrar doctores por consultorioId
    return allDoctores.filter((d: any) => String(d.consultorioId) === String(selectedConsultorioId));
  }, [selectedConsultorioId, allDoctores]);

  // Helper para resolver el nombre legible de una especialidad a partir de su código o ID
  const resolveEspecialidadNombre = (codOrName: string) => {
    if (!codOrName) return '-';
    // Buscar entre las especialidades conocidas (hardcoded como fallback)
    const espMap: Record<string, string> = {
      'CARDIO': 'Cardiología',
      'PEDIATRIA': 'Pediatría',
      'CLINICA': 'Clínica General',
      'TRAUMA': 'Traumatología',
    };
    return espMap[codOrName] || codOrName;
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
    const turnosDoctorExistentes = turnos.filter(
      (t: any) => String(t.doctorId) === String(selectedDoctorId) &&
                  t.estado !== 'CANCELADO' &&
                  t.fechaHoraPlanificado?.startsWith(selectedFecha)
    );
    const turnosPacienteExistentes = turnos.filter(
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

  const getDoctorFormalTitle = (doctor: any) => {
    const sexo = doctor?.sexo || doctor?.configuracion?.sexo;
    let name = doctor?.nombreEmpleado || doctor?.nombre || '';
    name = name.replace(/^(Dr\.|Dra\.|Doctora|Doctor)\s+/i, '').trim();

    if (sexo === 'FEMENINO') {
      return { articulo: 'La', display: name ? `Dra. ${name}` : 'Dra.' };
    }
    if (sexo === 'MASCULINO') {
      return { articulo: 'El', display: name ? `Dr. ${name}` : 'Dr.' };
    }
    if (sexo === 'PREFIERO_NO_DECIRLO') {
      return { articulo: 'El/La profesional', display: name ? `Dr./Dra. ${name}` : 'profesional médico/a' };
    }

    // Fallback por defecto si no hay sexo configurado explícitamente
    const orig = doctor?.nombreEmpleado || doctor?.nombre || '';
    if (orig.startsWith('Dra.')) return { articulo: 'La', display: orig };
    if (orig.startsWith('Dr.')) return { articulo: 'El', display: orig };

    return { articulo: 'El/La profesional', display: name ? `Dr./Dra. ${name}` : 'profesional médico/a' };
  };

  const checkDoctorAgeRestriction = (docId: string): boolean => {
    if (!docId) return true;
    const doctor = allDoctores.find((d: any) => String(d.id) === String(docId));
    if (!doctor) return true;

    let edadPaciente: number | undefined = (user as any)?.edad;
    if (edadPaciente === undefined && (user as any)?.fechaNacimiento) {
      edadPaciente = new Date().getFullYear() - new Date((user as any).fechaNacimiento).getFullYear();
    }

    const docConfig = doctor?.configuracion || {};
    const edadMin = doctor?.edadMinima !== undefined && doctor?.edadMinima !== null && doctor?.edadMinima !== '' ? doctor.edadMinima : docConfig.edadMinima;
    const edadMax = doctor?.edadMaxima !== undefined && doctor?.edadMaxima !== null && doctor?.edadMaxima !== '' ? doctor.edadMaxima : docConfig.edadMaxima;

    const { articulo, display } = getDoctorFormalTitle(doctor);

    if (edadMin !== undefined && edadMin !== null && edadMin !== '' && edadPaciente !== undefined && edadPaciente < Number(edadMin)) {
      toast.error(`${articulo} ${display} sólo atiende a pacientes a partir de los ${edadMin} años (su edad registrada es de ${edadPaciente} años).`);
      return false;
    }

    if (edadMax !== undefined && edadMax !== null && edadMax !== '' && edadPaciente !== undefined && edadPaciente > Number(edadMax)) {
      toast.error(`${articulo} ${display} sólo atiende a pacientes de hasta ${edadMax} años (su edad registrada es de ${edadPaciente} años).`);
      return false;
    }

    return true;
  };

  const handleDoctorChange = (docId: string) => {
    if (!docId) {
      setSelectedDoctorId('');
      setSelectedFecha('');
      setSelectedHora('');
      return;
    }

    if (!checkDoctorAgeRestriction(docId)) {
      setSelectedDoctorId('');
      setSelectedFecha('');
      setSelectedHora('');
      return;
    }

    setSelectedDoctorId(docId);
    setSelectedFecha('');
    setSelectedHora('');
  };

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

      // Regla 0: Validación de Edad del Paciente vs Restricciones del Médico
      let edadPaciente: number | undefined = (user as any)?.edad;
      if (edadPaciente === undefined && (user as any)?.fechaNacimiento) {
        edadPaciente = new Date().getFullYear() - new Date((user as any).fechaNacimiento).getFullYear();
      }
      if (edadPaciente === undefined) {
        // La edad ya viene del user (desde Supabase al hacer login)
        edadPaciente = undefined; // No hay información de edad disponible
      }

      const docConfig = doctor?.configuracion || {};
      const edadMin = doctor?.edadMinima !== undefined && doctor?.edadMinima !== null && doctor?.edadMinima !== '' ? doctor.edadMinima : docConfig.edadMinima;
      const edadMax = doctor?.edadMaxima !== undefined && doctor?.edadMaxima !== null && doctor?.edadMaxima !== '' ? doctor.edadMaxima : docConfig.edadMaxima;

      const { articulo, display } = getDoctorFormalTitle(doctor);

      if (edadMin !== undefined && edadMin !== null && edadMin !== '' && edadPaciente !== undefined && edadPaciente < Number(edadMin)) {
        toast.error(`${articulo} ${display} sólo atiende a pacientes a partir de los ${edadMin} años (su edad registrada es de ${edadPaciente} años).`);
        setSubmitting(false);
        return;
      }

      if (edadMax !== undefined && edadMax !== null && edadMax !== '' && edadPaciente !== undefined && edadPaciente > Number(edadMax)) {
        toast.error(`${articulo} ${display} sólo atiende a pacientes de hasta ${edadMax} años (su edad registrada es de ${edadPaciente} años).`);
        setSubmitting(false);
        return;
      }

      // Obtenemos los turnos del estado (ya cargados desde Supabase)
      const storedTurnos = turnos.filter(
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
        toast.error(`Ya posee un turno registrado en estado PENDIENTE para la especialidad "${espNombre}".`);
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
        toast.error('El horario seleccionado se solapa con otro turno previamente reservado.');
        setSubmitting(false);
        return;
      }

      // Obtener datos del paciente para guardar en el turno
      const pacientes = await turnoSupabaseApi.getPacienteTodos();
      const paciente = pacientes.find((p: any) => p.id === user.id || p.usuario === user.usuario);

      const nuevoTurno = await turnoSupabaseApi.crearTurno({
        pacienteId: user.id,
        doctorId: Number(selectedDoctorId),
        pacienteNombre: paciente?.nombrePaciente || user.nombre || 'Paciente',
        pacienteDni: paciente?.dniPaciente || '',
        pacienteEdad: paciente?.edad,
        doctorNombre: doctor?.nombreEmpleado || 'Dr.',
        especialidadCod: selectedEspecialidad,
        especialidadNombre: espNombre,
        consultorioNombre: consultorio?.nombreConsultorio || '',
        consultorioId: Number(selectedConsultorioId),
        fechaHoraPlanificado: `${selectedFecha}T${selectedHora}:00`,
        descripcion,
      });

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

  const handleCancelarTurno = async (turno: any) => {
    const doc = allDoctoresState.find((d: any) => d.id === turno.doctorId);
    const fechaTurnoStr = turno.fechaHoraPlanificado.substring(0, 10);
    const fechaDate = new Date(fechaTurnoStr + 'T00:00:00');
    const diaSemana = fechaDate.getDay() === 0 ? 7 : fechaDate.getDay();

    const agendaDoc = doc?.configuracion?.agenda || [];
    const bloquesDia = agendaDoc.filter((a: any) => Number(a.diaSemana) === diaSemana);
    let horaInicioJornada = '08:00';
    if (bloquesDia.length > 0) {
      bloquesDia.sort((a: any, b: any) => a.horaInicio.localeCompare(b.horaInicio));
      horaInicioJornada = bloquesDia[0].horaInicio;
    }

    const jornadaInicioMs = new Date(`${fechaTurnoStr}T${horaInicioJornada}:00`).getTime();
    const limite8hsMs = jornadaInicioMs - 8 * 60 * 60 * 1000;
    const ahoraMs = Date.now();

    try {
      if (ahoraMs < limite8hsMs) {
        await turnoSupabaseApi.actualizarEstadoTurno(turno.id, 'CANCELADO');
        setTurnos((prev) => prev.filter((t: any) => t.id !== turno.id));
        toast.success('Turno cancelado a tiempo. El horario quedó libre.');
      } else {
        await turnoSupabaseApi.actualizarEstadoTurno(turno.id, 'CANCELADO');
        setTurnos((prev) =>
          prev.map((t: any) => (t.id === turno.id ? { ...t, estado: 'CANCELADO' } : t))
        );
        toast.error('Turno cancelado dentro de las 8hs previas. Quedó marcado como CANCELADO (Sobreturno).');
      }
    } catch {
      toast.error('Error al cancelar el turno.');
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
                  <th>Acciones</th>
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
                      <span className={`badge badge-${turno.estado === 'CONFIRMADO' || turno.estado === 'PRESENTE' ? 'success' : turno.estado === 'PENDIENTE' ? 'warning' : 'primary'}`}>
                        {turno.estado}
                      </span>
                    </td>
                    <td>
                      {turno.estado !== 'CANCELADO' && (
                        <button
                          className="btn btn-sm btn-secondary"
                          style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                          onClick={() => handleCancelarTurno(turno)}
                        >
                          Cancelar
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
                    onChange={(e) => handleDoctorChange(e.target.value)}
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
