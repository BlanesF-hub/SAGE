import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { doctorApi, consultaApi, adminApi, consultorioAdminApi } from '../services/api';
import type { Consulta, Especialidad } from '../types';
import { FiUser, FiClock, FiAlertTriangle, FiCheck, FiSettings, FiCalendar, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [salas, setSalas] = useState<any[]>([]);
  const [turnosDia, setTurnosDia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [configOpen, setConfigOpen] = useState(false);
  const [priorizarOpen, setPriorizarOpen] = useState(false);
  const [atenderOpen, setAtenderOpen] = useState(false);
  const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(null);

  // Doctor config states
  const [selectedEspecialidad, setSelectedEspecialidad] = useState('');
  const [edadMinima, setEdadMinima] = useState('');
  const [edadMaxima, setEdadMaxima] = useState(''); // Empty string = sin máximo
  const [agendaRows, setAgendaRows] = useState<{ diaSemana: number; horaInicio: string; horaFin: string; tiempoMaximoEspera: number; salaId?: number }[]>([]);

  // Action states
  const [prioridad, setPrioridad] = useState('1');
  const [diagnostico, setDiagnostico] = useState('');
  const [tratamiento, setTratamiento] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filtros de fecha
  const todayStr = new Date().toISOString().split('T')[0];
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');

  useEffect(() => {
    fetchConsultas();
    fetchEspecialidades();
    fetchSalas();
    fetchTurnosDia();
  }, [user]);

  const fetchTurnosDia = () => {
    if (!user) return;
    const allTurnos = JSON.parse(localStorage.getItem('mock_turnos_paciente') || '[]');
    const allPacientes = JSON.parse(localStorage.getItem('mock_pacientes') || '[]');
    const myTurnos = allTurnos.filter((t: any) => String(t.doctorId) === String(user.id));
    const enriched = myTurnos.map((t: any) => {
      const pac = allPacientes.find((p: any) => p.id === t.pacienteId);
      return {
        ...t,
        pacienteNombre: pac?.nombrePaciente || 'Paciente',
        pacienteDni: pac?.dniPaciente || '-',
        pacienteTel: pac?.nroTelefonoPaciente || pac?.nroTelefono || '-',
      };
    });
    setTurnosDia(enriched);
  };

  // Turnos de HOY
  const turnosHoy = useMemo(() => {
    return turnosDia.filter((t: any) => t.fechaHoraPlanificado?.startsWith(todayStr));
  }, [turnosDia, todayStr]);

  // Turnos filtrados por el rango seleccionado en "Consultar Agenda"
  const turnosFiltrados = useMemo(() => {
    if (!filterFechaDesde) return [];
    const desde = filterFechaDesde;
    const hasta = filterFechaHasta && filterFechaHasta >= filterFechaDesde ? filterFechaHasta : filterFechaDesde;
    return turnosDia.filter((t: any) => {
      const f = t.fechaHoraPlanificado?.substring(0, 10);
      return f >= desde && f <= hasta;
    });
  }, [turnosDia, filterFechaDesde, filterFechaHasta]);

  const fetchSalas = async () => {
    try {
       // Re-use admin api for mock
       const data = await consultorioAdminApi.getSalas();
       setSalas(data);
    } catch {
       console.error("Error al cargar salas");
    }
  };

  const fetchConsultas = async () => {
    setLoading(true);
    try {
      // In production: fetch doctor's patient queue
      // api.get(`/api/consultas/doctor/${user.id}`)
      setLoading(false);
    } catch {
      toast.error('Error al cargar consultas');
      setLoading(false);
    }
  };

  const fetchEspecialidades = async () => {
    try {
      const data = await adminApi.getEspecialidades();
      setEspecialidades(data);
    } catch {
      toast.error('Error al cargar especialidades');
    }
  };

  const handleConfigurar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await doctorApi.configurar({
        codEspecialidad: selectedEspecialidad,
        edadMinima: edadMinima ? Number(edadMinima) : undefined,
        edadMaxima: edadMaxima ? Number(edadMaxima) : undefined,
        agenda: agendaRows, // Sending the same read-only rows back
      });
      toast.success('Cuenta de médico configurada con éxito.');
      setConfigOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data || 'Error al guardar configuración');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePriorizar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsulta) return;
    setSubmitting(true);
    try {
      await consultaApi.priorizar(selectedConsulta.id, Number(prioridad));
      toast.success('Urgencia clasificada correctamente.');
      setPriorizarOpen(false);
      setSelectedConsulta(null);
      fetchConsultas();
    } catch (err: any) {
      toast.error(err.response?.data || 'Error al priorizar urgencia');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvanzarConsulta = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!selectedConsulta) return;
    setSubmitting(true);
    try {
      const isEnCurso = selectedConsulta.estados[selectedConsulta.estados.length - 1]?.estadoConsulta.codEc === 'EN_CURSO';
      await consultaApi.avanzar(
        selectedConsulta.id,
        isEnCurso ? diagnostico : undefined,
        isEnCurso ? tratamiento : undefined,
        isEnCurso ? observaciones : undefined
      );
      toast.success(isEnCurso ? 'Consulta finalizada con éxito' : 'Consulta iniciada');
      setAtenderOpen(false);
      setSelectedConsulta(null);
      setDiagnostico('');
      setTratamiento('');
      setObservaciones('');
      fetchConsultas();
    } catch (err: any) {
      toast.error(err.response?.data || 'Error al procesar consulta');
    } finally {
      setSubmitting(false);
    }
  };

  const agregarAgendaFila = () => {
    setAgendaRows((prev) => [...prev, { diaSemana: 1, horaInicio: '08:00', horaFin: '12:00', tiempoMaximoEspera: 15 }]);
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Panel Médico</h1>
          <p className="page-subtitle">Atención de pacientes, evolución de consultas y urgencias</p>
        </div>
        <button id="btn-config-doc" className="btn btn-secondary" onClick={() => {
           const currentUser = JSON.parse(localStorage.getItem('sage_user') || '{}');
           const doctores = JSON.parse(localStorage.getItem('mock_doctores') || '[]');
           const me = doctores.find((d: any) => d.id === currentUser.id);
           if (me && me.configuracion?.agenda) {
              setAgendaRows(me.configuracion.agenda);
           }
           setConfigOpen(true);
        }}>
          <FiSettings /> Configurar Cuenta
        </button>
      </div>

      {/* ═══════ SECCIÓN 1: Turnos del Día (HOY) ═══════ */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiClock style={{ color: 'var(--primary-color)' }} /> Turnos del Día — {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </h3>

        {turnosHoy.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 16px' }}>
            <FiUser className="empty-state-icon" />
            <h3 className="empty-state-title">No tenés turnos programados para hoy</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Usá la sección "Consultar Agenda" para explorar otros días.</p>
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
                  <th>Motivo de Consulta</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {turnosHoy.map((t: any) => (
                  <tr key={t.id}>
                    <td>
                      <strong>
                        {new Date(t.fechaHoraPlanificado).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </strong>
                    </td>
                    <td>{t.pacienteNombre}</td>
                    <td>{t.pacienteDni}</td>
                    <td>{t.pacienteTel}</td>
                    <td>{t.descripcion || 'Sin motivo especificado'}</td>
                    <td>
                      {t.estado === 'CANCELADO' ? (
                        <span className="badge badge-danger">CANCELADO — Sobreturno disponible</span>
                      ) : t.estado === 'PRESENTE' ? (
                        <span className="badge badge-success">PRESENTE</span>
                      ) : (
                        <span className="badge badge-warning">{t.estado}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════ SECCIÓN 2: Consultar Agenda (Filtro con 2 calendarios) ═══════ */}
      <div className="card">
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiCalendar style={{ color: '#34d399' }} /> Consultar Agenda
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
          Seleccioná una <strong>Fecha Desde</strong> para ver los turnos de un día en particular.
          Si querés ver un lapso, completá también la <strong>Fecha Hasta</strong>.
        </p>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="input-group" style={{ width: '200px', marginBottom: 0 }}>
            <label htmlFor="doc-fecha-desde">Fecha Desde <span style={{ color: '#f87171' }}>*</span></label>
            <input
              id="doc-fecha-desde"
              type="date"
              className="input-field"
              value={filterFechaDesde}
              onChange={(e) => {
                setFilterFechaDesde(e.target.value);
                // Si "hasta" es anterior a "desde", limpiar "hasta"
                if (filterFechaHasta && e.target.value > filterFechaHasta) {
                  setFilterFechaHasta('');
                }
              }}
            />
          </div>
          <div className="input-group" style={{ width: '200px', marginBottom: 0 }}>
            <label htmlFor="doc-fecha-hasta">Fecha Hasta <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(opcional)</span></label>
            <input
              id="doc-fecha-hasta"
              type="date"
              className="input-field"
              value={filterFechaHasta}
              min={filterFechaDesde || undefined}
              onChange={(e) => setFilterFechaHasta(e.target.value)}
              disabled={!filterFechaDesde}
            />
          </div>
          {(filterFechaDesde || filterFechaHasta) && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => { setFilterFechaDesde(''); setFilterFechaHasta(''); }}
              style={{ height: '38px' }}
            >
              Limpiar filtro
            </button>
          )}
        </div>

        {!filterFechaDesde ? (
          <div className="empty-state" style={{ padding: '32px 16px' }}>
            <FiFilter className="empty-state-icon" style={{ fontSize: '2rem' }} />
            <h3 className="empty-state-title">Seleccioná una fecha para consultar tu agenda</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Ingresá una fecha en "Fecha Desde" para ver los turnos de ese día, o agregá "Fecha Hasta" para un rango.</p>
          </div>
        ) : turnosFiltrados.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {filterFechaHasta && filterFechaHasta > filterFechaDesde
              ? `No tenés turnos registrados entre ${filterFechaDesde} y ${filterFechaHasta}.`
              : `No tenés turnos registrados para el día ${filterFechaDesde}.`}
          </p>
        ) : (
          <>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '10px' }}>
              {filterFechaHasta && filterFechaHasta > filterFechaDesde
                ? `Mostrando ${turnosFiltrados.length} turno(s) entre ${filterFechaDesde} y ${filterFechaHasta}`
                : `Mostrando ${turnosFiltrados.length} turno(s) para el ${filterFechaDesde}`}
            </p>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Paciente</th>
                    <th>DNI</th>
                    <th>Teléfono</th>
                    <th>Motivo de Consulta</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {turnosFiltrados.map((t: any) => (
                    <tr key={t.id}>
                      <td>
                        <strong>
                          {new Date(t.fechaHoraPlanificado).toLocaleString('es-AR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </strong>
                      </td>
                      <td>{t.pacienteNombre}</td>
                      <td>{t.pacienteDni}</td>
                      <td>{t.pacienteTel}</td>
                      <td>{t.descripcion || 'Sin motivo especificado'}</td>
                      <td>
                        {t.estado === 'CANCELADO' ? (
                          <span className="badge badge-danger">CANCELADO — Sobreturno disponible</span>
                        ) : t.estado === 'PRESENTE' ? (
                          <span className="badge badge-success">PRESENTE</span>
                        ) : (
                          <span className="badge badge-warning">{t.estado}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal Configuración */}
      {configOpen && (
        <div className="modal-overlay">
          <div className="modal-content card-glass" style={{ maxWidth: '650px' }}>
            <h2 className="modal-title">Configuración de Médico</h2>
            <form onSubmit={handleConfigurar} className="auth-form">
              <div className="input-group">
                <label htmlFor="config-especialidad">Especialidad</label>
                <select
                  id="config-especialidad"
                  className="input-field"
                  value={selectedEspecialidad}
                  onChange={(e) => setSelectedEspecialidad(e.target.value)}
                  required
                >
                  <option value="">Seleccione especialidad</option>
                  {especialidades.map((esp) => (
                    <option key={esp.id} value={esp.codEspecialidad}>
                      {esp.nombreEspecialidad}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label htmlFor="config-edadmin">Edad Mínima permitida</label>
                  <input
                    id="config-edadmin"
                    type="number"
                    className="input-field"
                    value={edadMinima}
                    onChange={(e) => setEdadMinima(e.target.value)}
                    placeholder="Ej: 18 (Opcional)"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="config-edadmax">Edad Máxima permitida</label>
                  <input
                    id="config-edadmax"
                    type="number"
                    className="input-field"
                    value={edadMaxima}
                    onChange={(e) => setEdadMaxima(e.target.value)}
                    placeholder="Dejar vacío para 'Sin Máximo'"
                  />
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontWeight: 600 }}>Agenda y Salas (Asignado por Administración)</label>
                </div>
                {agendaRows.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Aún no se le han asignado días ni salas de atención.</p>
                ) : (
                agendaRows.map((row, idx) => (
                  <div key={idx} className="grid-3" style={{ marginBottom: '8px', alignItems: 'center' }}>
                    <select className="input-field" value={row.diaSemana} disabled>
                      <option value="1">Lunes</option>
                      <option value="2">Martes</option>
                      <option value="3">Miércoles</option>
                      <option value="4">Jueves</option>
                      <option value="5">Viernes</option>
                      <option value="6">Sábado</option>
                      <option value="7">Domingo</option>
                    </select>
                    <select className="input-field" value={row.salaId} disabled>
                       {salas.map((s) => <option key={s.id} value={s.id}>{s.nombreSala}</option>)}
                    </select>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="time" className="input-field" value={row.horaInicio} disabled />
                      <input type="time" className="input-field" value={row.horaFin} disabled />
                    </div>
                  </div>
                ))
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setConfigOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  Guardar Configuración
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Priorizar */}
      {priorizarOpen && selectedConsulta && (
        <div className="modal-overlay">
          <div className="modal-content card-glass">
            <h2 className="modal-title">Clasificación de Urgencia</h2>
            <form onSubmit={handlePriorizar} className="auth-form">
              <div className="input-group">
                <label htmlFor="prio-select">Clasificación / Triage</label>
                <select
                  id="prio-select"
                  className="input-field"
                  value={prioridad}
                  onChange={(e) => setPrioridad(e.target.value)}
                  required
                >
                  <option value="1">Prioridad 1 - Sobreturno inmediato (Intercalado)</option>
                  <option value="2">Prioridad 2 - Atender al final de la jornada</option>
                  <option value="3">Prioridad 3 - No es urgencia (Rechazada)</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setPriorizarOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-danger" disabled={submitting}>
                  Asignar Prioridad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Finalizar Consulta */}
      {atenderOpen && selectedConsulta && (
        <div className="modal-overlay">
          <div className="modal-content card-glass" style={{ maxWidth: '600px' }}>
            <h2 className="modal-title">Finalizar Consulta Médica</h2>
            <form onSubmit={handleAvanzarConsulta} className="auth-form">
              <div className="input-group">
                <label htmlFor="cons-diag">Diagnóstico</label>
                <textarea
                  id="cons-diag"
                  className="input-field"
                  rows={3}
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="cons-trat">Tratamiento</label>
                <textarea
                  id="cons-trat"
                  className="input-field"
                  rows={3}
                  value={tratamiento}
                  onChange={(e) => setTratamiento(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="cons-obs">Observaciones adicionales</label>
                <textarea
                  id="cons-obs"
                  className="input-field"
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setAtenderOpen(false)}>
                  Volver
                </button>
                <button type="submit" className="btn btn-success" disabled={submitting}>
                  Finalizar y Cerrar Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
