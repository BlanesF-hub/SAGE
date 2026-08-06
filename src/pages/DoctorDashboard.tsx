import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doctorApi, consultaApi, adminApi, consultorioAdminApi } from '../services/api';
import type { Consulta, Especialidad } from '../types';
import { FiActivity, FiUser, FiClock, FiAlertTriangle, FiCheck, FiSettings } from 'react-icons/fi';
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

      {/* Sección Turnos del Médico */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiClock style={{ color: 'var(--primary-color)' }} /> Mis Turnos Programados
        </h3>
        {turnosDia.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No tenés turnos agendados por pacientes aún.</p>
        ) : (
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
                {turnosDia.map((t: any) => (
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
        )}
      </div>

      <div className="card">
        {loading ? (
          <div className="skeleton" style={{ height: '200px' }} />
        ) : consultas.length === 0 ? (
          <div className="empty-state">
            <FiUser className="empty-state-icon" />
            <h3 className="empty-state-title">No hay pacientes en espera</h3>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Turno</th>
                  <th>Paciente</th>
                  <th>Edad</th>
                  <th>Tipo</th>
                  <th>Estado Consulta</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {consultas.map((c) => {
                  const estadoActual = c.estados[c.estados.length - 1]?.estadoConsulta.codEc;
                  return (
                    <tr key={c.id}>
                      <td>{new Date(c.turno.fechaHoraPlanificado).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td>{c.turno.paciente?.nombrePaciente || 'S/N'}</td>
                      <td>{c.turno.paciente ? new Date().getFullYear() - new Date(c.turno.paciente.fechaNacimiento).getFullYear() : '-'} años</td>
                      <td>
                        <span className={`badge badge-${c.turno.tipoTurno.codTipoTurno === 'URGENCIA' ? 'danger' : 'primary'}`}>
                          {c.turno.tipoTurno.nombreTipoTurno}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-accent">{estadoActual}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {estadoActual === 'PENDIENTE' && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => {
                                setSelectedConsulta(c);
                                setPriorizarOpen(true);
                              }}
                            >
                              <FiAlertTriangle /> Priorizar
                            </button>
                          )}
                          {estadoActual === 'EN_ESPERA' && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={(e) => {
                                setSelectedConsulta(c);
                                handleAvanzarConsulta(e);
                              }}
                            >
                              Iniciar Atención
                            </button>
                          )}
                          {estadoActual === 'EN_CURSO' && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => {
                                setSelectedConsulta(c);
                                setAtenderOpen(true);
                              }}
                            >
                              <FiCheck /> Finalizar Consulta
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
