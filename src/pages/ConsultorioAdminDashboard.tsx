import { useState, useEffect } from 'react';
import { consultorioAdminApi } from '../services/api';
import { FiUsers, FiPlus, FiMapPin, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ConsultorioAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'PERSONAL' | 'SALAS'>('PERSONAL');
  
  const [roleType, setRoleType] = useState<'DOCTOR' | 'SECRETARIO'>('DOCTOR');
  const [modalOpen, setModalOpen] = useState(false);
  
  const [modalSalaOpen, setModalSalaOpen] = useState(false);
  const [modalAgendaOpen, setModalAgendaOpen] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [doctores, setDoctores] = useState<any[]>([]);
  const [secretarios, setSecretarios] = useState<any[]>([]);
  const [salas, setSalas] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setDoctores(await consultorioAdminApi.getDoctores());
      setSecretarios(await consultorioAdminApi.getSecretarios());
      setSalas(await consultorioAdminApi.getSalas());
    } catch (err) {
      console.error(err);
    }
  };

  // Form states Personal
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [nombreEmpleado, setNombreEmpleado] = useState('');
  const [nroTelefono, setNroTelefono] = useState('');
  const [codPersonal, setCodPersonal] = useState(''); 

  // Form states Salas
  const [codSala, setCodSala] = useState('');
  const [nombreSala, setNombreSala] = useState('');
  
  // Form states Agenda
  const [agendaRows, setAgendaRows] = useState<{ diaSemana: number; horaInicio: string; horaFin: string; tiempoMaximoEspera: number; salaId: number }[]>([]);

  const handleSubmitPersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (roleType === 'DOCTOR') {
        await consultorioAdminApi.crearDoctor({
          usuario, contrasena, nombreEmpleado, nroTelefono: nroTelefono || undefined, codDoctor: codPersonal,
        });
        toast.success('Médico creado exitosamente con contraseña provisional');
      } else {
        await consultorioAdminApi.crearSecretario({
          usuario, contrasena, nombreEmpleado, nroTelefono: nroTelefono || undefined, codSecretario: codPersonal,
        });
        toast.success('Secretario creado exitosamente con contraseña provisional');
      }
      setModalOpen(false);
      fetchData();
      setUsuario(''); setContrasena(''); setNombreEmpleado(''); setNroTelefono(''); setCodPersonal('');
    } catch (err: any) {
      toast.error(err.response?.data || 'Error al crear personal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitSala = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await consultorioAdminApi.crearSala({ codSala, nombreSala });
      toast.success('Sala creada con éxito');
      setModalSalaOpen(false);
      fetchData();
      setCodSala(''); setNombreSala('');
    } catch (err: any) {
      toast.error(err.response?.data || 'Error al crear sala');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleOpenAgenda = (doc: any) => {
    setSelectedDoctor(doc);
    if (doc.configuracion?.agenda?.length > 0) {
      setAgendaRows(doc.configuracion.agenda);
    } else {
      setAgendaRows([]);
    }
    setModalAgendaOpen(true);
  };
  
  const agregarAgendaFila = () => {
    if (salas.length === 0) {
      toast.error('Primero debes crear al menos una sala');
      return;
    }
    setAgendaRows((prev) => [...prev, { diaSemana: 1, horaInicio: '08:00', horaFin: '12:00', tiempoMaximoEspera: 15, salaId: salas[0].id }]);
  };
  
  const handleSubmitAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
       await consultorioAdminApi.asignarAgendaDoctor(selectedDoctor.id, agendaRows);
       toast.success('Agenda y salas asignadas con éxito');
       setModalAgendaOpen(false);
       fetchData();
    } catch (err: any) {
       toast.error(err.response?.data || 'Error al asignar agenda');
    } finally {
       setSubmitting(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Administración del Consultorio</h1>
          <p className="page-subtitle">Gestión y registro de médicos, secretarios y consultorios (salas)</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button id="btn-add-sala" className="btn btn-secondary" onClick={() => setModalSalaOpen(true)}>
            <FiPlus /> Nueva Sala / Box
          </button>
          <button id="btn-add-staff" className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <FiPlus /> Registrar Personal
          </button>
        </div>
      </div>
      
      <div className="tabs" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
         <button className={`btn ${activeTab === 'PERSONAL' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('PERSONAL')}>
           <FiUsers /> Personal
         </button>
         <button className={`btn ${activeTab === 'SALAS' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('SALAS')}>
           <FiMapPin /> Salas / Consultorios Internos
         </button>
      </div>

      <div className="card">
        {activeTab === 'PERSONAL' ? (
        doctores.length === 0 && secretarios.length === 0 ? (
          <div className="empty-state">
            <FiUsers className="empty-state-icon" />
            <h3 className="empty-state-title">Gestión de Personal Clínico</h3>
            <p className="empty-state-desc">
              Use el botón "Registrar Personal" para agregar médicos o secretarios a la clínica.
            </p>
          </div>
        ) : (
          <div className="grid-2">
            <div>
              <h3 style={{ marginBottom: '12px' }}>Médicos</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Nombre Completo</th>
                      <th>Matrícula</th>
                      <th>Salas Asignadas</th>
                      <th>Agenda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctores.map((d) => {
                      // Calcular salas únicas asignadas a este médico
                      const agendaDoc = d.configuracion?.agenda || [];
                      const salasAsignadasIds = Array.from(new Set(agendaDoc.map((a: any) => a.salaId)));
                      const nombresSalas = salasAsignadasIds
                        .map((id) => salas.find((s) => s.id === id)?.nombreSala)
                        .filter(Boolean)
                        .join(', ');

                      return (
                        <tr key={d.id}>
                          <td><strong style={{ color: 'var(--primary-color)' }}>{d.usuario}</strong></td>
                          <td>{d.nombreEmpleado}</td>
                          <td>{d.codDoctor}</td>
                          <td>
                            {nombresSalas ? (
                              <span className="badge badge-primary">{nombresSalas}</span>
                            ) : (
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Sin asignar</span>
                            )}
                          </td>
                          <td>
                             <button className="btn btn-sm btn-secondary" onClick={() => handleOpenAgenda(d)}>
                                <FiCalendar /> Configurar
                             </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h3 style={{ marginBottom: '12px' }}>Secretarios</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Nombre Completo</th>
                      <th>Código</th>
                    </tr>
                  </thead>
                  <tbody>
                    {secretarios.map((s) => (
                      <tr key={s.id}>
                        <td><strong style={{ color: 'var(--primary-color)' }}>{s.usuario}</strong></td>
                        <td>{s.nombreEmpleado}</td>
                        <td>{s.codSecretario}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
        ) : (
           salas.length === 0 ? (
             <div className="empty-state">
                <FiMapPin className="empty-state-icon" />
                <h3 className="empty-state-title">Sin Salas Configuradas</h3>
                <p className="empty-state-desc">
                  Presiona "Nueva Sala / Box" para crear los consultorios físicos.
                </p>
             </div>
           ) : (
             <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nombre / Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salas.map((s) => (
                      <tr key={s.id}>
                        <td>{s.codSala}</td>
                        <td>{s.nombreSala}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
           )
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card-glass">
            <h2 className="modal-title">Registrar Nuevo Empleado</h2>
            <form onSubmit={handleSubmitPersonal} className="auth-form">
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
                <input id="staff-name" className="input-field" value={nombreEmpleado} onChange={(e) => setNombreEmpleado(e.target.value)} required />
              </div>
              <div className="input-group">
                <label htmlFor="staff-usr">Nombre de Usuario</label>
                <input id="staff-usr" className="input-field" value={usuario} onChange={(e) => setUsuario(e.target.value)} required />
              </div>
              <div className="input-group">
                <label htmlFor="staff-pass">Contraseña Provisional</label>
                <input id="staff-pass" className="input-field" value={contrasena} onChange={(e) => setContrasena(e.target.value)} required />
              </div>
              <div className="input-group">
                <label htmlFor="staff-cod">Código Identificador</label>
                <input id="staff-cod" className="input-field" value={codPersonal} onChange={(e) => setCodPersonal(e.target.value)} required />
              </div>
              <div className="input-group">
                <label htmlFor="staff-tel">Teléfono de contacto</label>
                <input id="staff-tel" className="input-field" value={nroTelefono} onChange={(e) => setNroTelefono(e.target.value)} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>Registrar Empleado</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {modalSalaOpen && (
        <div className="modal-overlay">
          <div className="modal-content card-glass" style={{ maxWidth: '400px' }}>
            <h2 className="modal-title">Registrar Nueva Sala</h2>
            <form onSubmit={handleSubmitSala} className="auth-form">
              <div className="input-group">
                <label htmlFor="sala-cod">Identificador (Ej: A, 1, 101)</label>
                <input id="sala-cod" className="input-field" value={codSala} onChange={(e) => setCodSala(e.target.value)} required />
              </div>
              <div className="input-group">
                <label htmlFor="sala-nom">Nombre (Ej: Consultorio Pediatría)</label>
                <input id="sala-nom" className="input-field" value={nombreSala} onChange={(e) => setNombreSala(e.target.value)} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModalSalaOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>Guardar Sala</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {modalAgendaOpen && selectedDoctor && (
        <div className="modal-overlay">
          <div className="modal-content card-glass" style={{ maxWidth: '800px' }}>
            <h2 className="modal-title">Agenda y Asignación de Salas: {selectedDoctor.nombreEmpleado}</h2>
            <form onSubmit={handleSubmitAgenda} className="auth-form">
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={agregarAgendaFila}>
                  + Agregar Día
                </button>
              </div>
              {agendaRows.map((row, idx) => (
                  <div key={idx} className="grid-3" style={{ marginBottom: '8px', alignItems: 'center' }}>
                    <select
                      className="input-field"
                      value={row.diaSemana}
                      onChange={(e) => {
                        const next = [...agendaRows];
                        next[idx].diaSemana = Number(e.target.value);
                        setAgendaRows(next);
                      }}
                    >
                      <option value="1">Lunes</option>
                      <option value="2">Martes</option>
                      <option value="3">Miércoles</option>
                      <option value="4">Jueves</option>
                      <option value="5">Viernes</option>
                      <option value="6">Sábado</option>
                      <option value="7">Domingo</option>
                    </select>
                    <select 
                      className="input-field"
                      value={row.salaId}
                      onChange={(e) => {
                         const next = [...agendaRows];
                         next[idx].salaId = Number(e.target.value);
                         setAgendaRows(next);
                      }}
                      required
                    >
                       <option value="">Seleccione Sala</option>
                       {salas.map((s) => <option key={s.id} value={s.id}>{s.nombreSala} (Cod: {s.codSala})</option>)}
                    </select>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="time"
                        className="input-field"
                        value={row.horaInicio}
                        onChange={(e) => {
                          const next = [...agendaRows];
                          next[idx].horaInicio = e.target.value;
                          setAgendaRows(next);
                        }}
                      />
                      <input
                        type="time"
                        className="input-field"
                        value={row.horaFin}
                        onChange={(e) => {
                          const next = [...agendaRows];
                          next[idx].horaFin = e.target.value;
                          setAgendaRows(next);
                        }}
                      />
                    </div>
                  </div>
                ))}
              
              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalAgendaOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>Asignar Horarios</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
}
