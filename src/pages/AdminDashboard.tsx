import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import type { Zona, Localidad, Consultorio, ObraSocial, Especialidad, TipoTurno, EstadoConsulta } from '../types';
import { FiGrid, FiMapPin, FiActivity, FiUsers, FiPlus, FiSettings } from 'react-icons/fi';
import toast from 'react-hot-toast';

type ActiveTab = 'ZONAS' | 'LOCALIDADES' | 'CONSULTORIOS' | 'PARAMETRICAS' | 'ADMINS';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ZONAS');
  const [loading, setLoading] = useState(true);

  // Lists
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [localidades, setLocalidades] = useState<Localidad[]>([]);
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [tiposTurno, setTiposTurno] = useState<TipoTurno[]>([]);
  const [estadosConsulta, setEstadosConsulta] = useState<EstadoConsulta[]>([]);
  const [adminsConsultorio, setAdminsConsultorio] = useState<any[]>([]);

  // Modales y formularios
  const [modalOpen, setModalOpen] = useState(false);
  const [parametricModalType, setParametricModalType] = useState<'OBRA_SOCIAL' | 'ESPECIALIDAD' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formZona, setFormZona] = useState({ codZona: '', nombreZona: '' });
  const [formLocalidad, setFormLocalidad] = useState({ codLocalidad: '', nombreLocalidad: '', zonaId: '' });
  const [formConsultorio, setFormConsultorio] = useState({ codConsultorio: '', nombreConsultorio: '', direccionConsultorio: '', localidadId: '' });
  const [formObraSocial, setFormObraSocial] = useState({ codObraSocial: '', nombreObraSocial: '' });
  const [formEspecialidad, setFormEspecialidad] = useState({ codEspecialidad: '', nombreEspecialidad: '' });
  const [formAdmin, setFormAdmin] = useState({ usuario: '', nombreEmpleado: '', nroTelefono: '', consultorioId: '' });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'ZONAS') setZonas(await adminApi.getZonas());
      if (activeTab === 'LOCALIDADES') {
        setLocalidades(await adminApi.getLocalidades());
        setZonas(await adminApi.getZonas());
      }
      if (activeTab === 'CONSULTORIOS') {
        setConsultorios(await adminApi.getConsultorios());
        setLocalidades(await adminApi.getLocalidades());
      }
      if (activeTab === 'PARAMETRICAS') {
        setObrasSociales(await adminApi.getObrasSociales());
        setEspecialidades(await adminApi.getEspecialidades());
        setTiposTurno(await adminApi.getTiposTurno());
        setEstadosConsulta(await adminApi.getEstadosConsulta());
      }
      if (activeTab === 'ADMINS') {
        setConsultorios(await adminApi.getConsultorios());
        setAdminsConsultorio(await adminApi.getAdminsConsultorio());
      }
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateZona = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminApi.createZona(formZona);
      toast.success('Zona creada exitosamente');
      setFormZona({ codZona: '', nombreZona: '' });
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data || 'Error al crear zona');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateLocalidad = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminApi.createLocalidad({
        codLocalidad: formLocalidad.codLocalidad,
        nombreLocalidad: formLocalidad.nombreLocalidad,
        zonaId: Number(formLocalidad.zonaId),
      });
      toast.success('Localidad creada exitosamente');
      setFormLocalidad({ codLocalidad: '', nombreLocalidad: '', zonaId: '' });
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data || 'Error al crear localidad');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateConsultorio = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminApi.createConsultorio({
        codConsultorio: formConsultorio.codConsultorio,
        nombreConsultorio: formConsultorio.nombreConsultorio,
        direccionConsultorio: formConsultorio.direccionConsultorio || undefined,
        localidadId: Number(formConsultorio.localidadId),
      });
      toast.success('Consultorio creado exitosamente');
      setFormConsultorio({ codConsultorio: '', nombreConsultorio: '', direccionConsultorio: '', localidadId: '' });
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data || 'Error al crear consultorio');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminApi.crearAdminConsultorio({
        usuario: formAdmin.usuario,
        nombreEmpleado: formAdmin.nombreEmpleado,
        nroTelefono: formAdmin.nroTelefono || undefined,
        consultorioId: Number(formAdmin.consultorioId),
      });
      toast.success('Administrador de consultorio creado con contraseña provisional "sage123"');
      setFormAdmin({ usuario: '', nombreEmpleado: '', nroTelefono: '', consultorioId: '' });
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data || 'Error al crear administrador');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateObraSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminApi.createObraSocial(formObraSocial);
      toast.success('Obra Social creada exitosamente');
      setFormObraSocial({ codObraSocial: '', nombreObraSocial: '' });
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data || 'Error al crear obra social');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateEspecialidad = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminApi.createEspecialidad(formEspecialidad);
      toast.success('Especialidad creada exitosamente');
      setFormEspecialidad({ codEspecialidad: '', nombreEspecialidad: '' });
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data || 'Error al crear especialidad');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Administración General</h1>
          <p className="page-subtitle">Gestión de zonas geográficas, consultorios, obras sociales y usuarios</p>
        </div>
        {activeTab !== 'PARAMETRICAS' && (
          <button id="btn-admin-add" className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <FiPlus /> Agregar Elemento
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="card-glass" style={{ display: 'flex', gap: '8px', padding: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {(['ZONAS', 'LOCALIDADES', 'CONSULTORIOS', 'PARAMETRICAS', 'ADMINS'] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="skeleton" style={{ height: '200px' }} />
        ) : activeTab === 'ZONAS' ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Fecha de Alta</th>
                </tr>
              </thead>
              <tbody>
                {zonas.map((z) => (
                  <tr key={z.id}>
                    <td>{z.codZona}</td>
                    <td>{z.nombreZona}</td>
                    <td>{new Date(z.fechaDesde).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'LOCALIDADES' ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Zona Asociada</th>
                </tr>
              </thead>
              <tbody>
                {localidades.map((l) => (
                  <tr key={l.id}>
                    <td>{l.codLocalidad}</td>
                    <td>{l.nombreLocalidad}</td>
                    <td>{l.zona?.nombreZona}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'CONSULTORIOS' ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Dirección</th>
                  <th>Localidad</th>
                </tr>
              </thead>
              <tbody>
                {consultorios.map((c) => (
                  <tr key={c.id}>
                    <td>{c.codConsultorio}</td>
                    <td>{c.nombreConsultorio}</td>
                    <td>{c.direccionConsultorio || '-'}</td>
                    <td>{c.localidad?.nombreLocalidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'PARAMETRICAS' ? (
          <div className="grid-2">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0 }}>Obras Sociales</h3>
                <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.9rem' }} onClick={() => { setParametricModalType('OBRA_SOCIAL'); setModalOpen(true); }}>
                  <FiPlus /> Agregar
                </button>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nombre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {obrasSociales.map((o) => (
                      <tr key={o.id}>
                        <td>{o.codObraSocial}</td>
                        <td>{o.nombreObraSocial}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0 }}>Especialidades</h3>
                <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.9rem' }} onClick={() => { setParametricModalType('ESPECIALIDAD'); setModalOpen(true); }}>
                  <FiPlus /> Agregar
                </button>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nombre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {especialidades.map((e) => (
                      <tr key={e.id}>
                        <td>{e.codEspecialidad}</td>
                        <td>{e.nombreEspecialidad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'ADMINS' && adminsConsultorio.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Contraseña</th>
                  <th>Nombre Completo</th>
                  <th>Teléfono</th>
                  <th>Consultorio ID</th>
                </tr>
              </thead>
              <tbody>
                {adminsConsultorio.map((adm) => (
                  <tr key={adm.id}>
                    <td><strong style={{ color: 'var(--primary-color)' }}>{adm.usuario}</strong></td>
                    <td><code>{adm.contrasena || 'sage123'}</code></td>
                    <td>{adm.nombreEmpleado}</td>
                    <td>{adm.nroTelefono || '-'}</td>
                    <td>{adm.consultorioId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <FiUsers className="empty-state-icon" />
            <h3 className="empty-state-title">Gestión de Administradores</h3>
            <p className="empty-state-desc">Use el botón "Agregar Elemento" superior para registrar administradores de consultorios.</p>
          </div>
        )}
      </div>

      {/* Modal Agregar */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card-glass">
            <h2 className="modal-title">Agregar nuevo elemento</h2>

            {activeTab === 'ZONAS' && (
              <form onSubmit={handleCreateZona} className="auth-form">
                <div className="input-group">
                  <label htmlFor="ad-cod-zona">Código Zona</label>
                  <input id="ad-cod-zona" className="input-field" required
                    value={formZona.codZona} onChange={(e) => setFormZona((p) => ({ ...p, codZona: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label htmlFor="ad-nom-zona">Nombre Zona</label>
                  <input id="ad-nom-zona" className="input-field" required
                    value={formZona.nombreZona} onChange={(e) => setFormZona((p) => ({ ...p, nombreZona: e.target.value }))} />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>Guardar</button>
                </div>
              </form>
            )}

            {activeTab === 'LOCALIDADES' && (
              <form onSubmit={handleCreateLocalidad} className="auth-form">
                <div className="input-group">
                  <label htmlFor="ad-cod-loc">Código Localidad</label>
                  <input id="ad-cod-loc" className="input-field" required
                    value={formLocalidad.codLocalidad} onChange={(e) => setFormLocalidad((p) => ({ ...p, codLocalidad: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label htmlFor="ad-nom-loc">Nombre Localidad</label>
                  <input id="ad-nom-loc" className="input-field" required
                    value={formLocalidad.nombreLocalidad} onChange={(e) => setFormLocalidad((p) => ({ ...p, nombreLocalidad: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label htmlFor="ad-loc-zona">Zona</label>
                  <select id="ad-loc-zona" className="input-field" required
                    value={formLocalidad.zonaId} onChange={(e) => setFormLocalidad((p) => ({ ...p, zonaId: e.target.value }))}>
                    <option value="">Seleccione zona</option>
                    {zonas.map((z) => <option key={z.id} value={z.id}>{z.nombreZona}</option>)}
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>Guardar</button>
                </div>
              </form>
            )}

            {activeTab === 'CONSULTORIOS' && (
              <form onSubmit={handleCreateConsultorio} className="auth-form">
                <div className="input-group">
                  <label htmlFor="ad-cod-con">Código Consultorio</label>
                  <input id="ad-cod-con" className="input-field" required
                    value={formConsultorio.codConsultorio} onChange={(e) => setFormConsultorio((p) => ({ ...p, codConsultorio: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label htmlFor="ad-nom-con">Nombre Consultorio</label>
                  <input id="ad-nom-con" className="input-field" required
                    value={formConsultorio.nombreConsultorio} onChange={(e) => setFormConsultorio((p) => ({ ...p, nombreConsultorio: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label htmlFor="ad-dir-con">Dirección</label>
                  <input id="ad-dir-con" className="input-field"
                    value={formConsultorio.direccionConsultorio} onChange={(e) => setFormConsultorio((p) => ({ ...p, direccionConsultorio: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label htmlFor="ad-con-loc">Localidad</label>
                  <select id="ad-con-loc" className="input-field" required
                    value={formConsultorio.localidadId} onChange={(e) => setFormConsultorio((p) => ({ ...p, localidadId: e.target.value }))}>
                    <option value="">Seleccione localidad</option>
                    {localidades.map((l) => <option key={l.id} value={l.id}>{l.nombreLocalidad}</option>)}
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>Guardar</button>
                </div>
              </form>
            )}

            {activeTab === 'ADMINS' && (
              <form onSubmit={handleCreateAdmin} className="auth-form">
                <div className="input-group">
                  <label htmlFor="ad-adm-usr">Nombre de Usuario</label>
                  <input id="ad-adm-usr" className="input-field" required
                    value={formAdmin.usuario} onChange={(e) => setFormAdmin((p) => ({ ...p, usuario: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label htmlFor="ad-adm-nom">Nombre Completo</label>
                  <input id="ad-adm-nom" className="input-field" required
                    value={formAdmin.nombreEmpleado} onChange={(e) => setFormAdmin((p) => ({ ...p, nombreEmpleado: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label htmlFor="ad-adm-tel">Teléfono</label>
                  <input id="ad-adm-tel" className="input-field"
                    value={formAdmin.nroTelefono} onChange={(e) => setFormAdmin((p) => ({ ...p, nroTelefono: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label htmlFor="ad-adm-con">Consultorio</label>
                  <select id="ad-adm-con" className="input-field" required
                    value={formAdmin.consultorioId} onChange={(e) => setFormAdmin((p) => ({ ...p, consultorioId: e.target.value }))}>
                    <option value="">Seleccione consultorio</option>
                    {consultorios.map((c) => <option key={c.id} value={c.id}>{c.nombreConsultorio}</option>)}
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>Crear Administrador</button>
                </div>
              </form>
            )}

            {activeTab === 'PARAMETRICAS' && parametricModalType === 'OBRA_SOCIAL' && (
              <form onSubmit={handleCreateObraSocial} className="auth-form">
                <div className="input-group">
                  <label htmlFor="ad-cod-os">Código Obra Social</label>
                  <input id="ad-cod-os" className="input-field" required
                    value={formObraSocial.codObraSocial} onChange={(e) => setFormObraSocial((p) => ({ ...p, codObraSocial: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label htmlFor="ad-nom-os">Nombre Obra Social</label>
                  <input id="ad-nom-os" className="input-field" required
                    value={formObraSocial.nombreObraSocial} onChange={(e) => setFormObraSocial((p) => ({ ...p, nombreObraSocial: e.target.value }))} />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>Guardar</button>
                </div>
              </form>
            )}

            {activeTab === 'PARAMETRICAS' && parametricModalType === 'ESPECIALIDAD' && (
              <form onSubmit={handleCreateEspecialidad} className="auth-form">
                <div className="input-group">
                  <label htmlFor="ad-cod-esp">Código Especialidad</label>
                  <input id="ad-cod-esp" className="input-field" required
                    value={formEspecialidad.codEspecialidad} onChange={(e) => setFormEspecialidad((p) => ({ ...p, codEspecialidad: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label htmlFor="ad-nom-esp">Nombre Especialidad</label>
                  <input id="ad-nom-esp" className="input-field" required
                    value={formEspecialidad.nombreEspecialidad} onChange={(e) => setFormEspecialidad((p) => ({ ...p, nombreEspecialidad: e.target.value }))} />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>Guardar</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
