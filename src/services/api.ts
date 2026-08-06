/* ============================================================
   SAGE — API Service Layer con Supabase como BD persistente
   ============================================================ */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { supabase } from './supabase';
import type {
  LoginRequest,
  LoginResponse,
  RegisterPacienteRequest,
  SolicitudTurnoRequest,
  ConfigurarDoctorRequest,
  Turno,
  Consulta,
  Doctor,
  Zona,
  Localidad,
  Consultorio,
  ObraSocial,
  Especialidad,
  TipoTurno,
  EstadoConsulta,
} from '../types';

// ── Base Axios instance ─────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
});

// ── JWT Interceptor ─────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('sage_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (typeof response.data === 'string' && response.data.trim().toLowerCase().startsWith('<!doctype html>')) {
      return Promise.reject(new Error('Backend no conectado.'));
    }
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sage_token');
      localStorage.removeItem('sage_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ── Helpers de mapeo Supabase → App ─────────────────
const mapDoctor = (d: any) => ({
  id: d.id,
  usuario: d.usuario,
  contrasena: d.contrasena,
  nombreEmpleado: d.nombre_empleado,
  codDoctor: d.cod_doctor,
  nroTelefono: d.nro_telefono,
  consultorioId: d.consultorio_id,
  esProvisoria: d.es_provisoria,
  edadMinima: d.edad_minima,
  edadMaxima: d.edad_maxima,
  sexo: d.sexo,
  configuracion: d.configuracion || {},
});

const mapSecretario = (s: any) => ({
  id: s.id,
  usuario: s.usuario,
  contrasena: s.contrasena,
  nombreEmpleado: s.nombre_empleado,
  codSecretario: s.cod_secretario,
  nroTelefono: s.nro_telefono,
  consultorioId: s.consultorio_id,
  esProvisoria: s.es_provisoria,
});

const mapAdmin = (a: any) => ({
  id: a.id,
  usuario: a.usuario,
  contrasena: a.contrasena,
  nombreEmpleado: a.nombre_empleado,
  consultorioId: a.consultorio_id,
  esProvisoria: a.es_provisoria,
});

const mapPaciente = (p: any) => ({
  id: p.id,
  usuario: p.usuario,
  contrasena: p.contrasena,
  nombrePaciente: p.nombre_paciente,
  dniPaciente: p.dni_paciente,
  nroTelefono: p.nro_telefono,
  edad: p.edad,
  fechaNacimiento: p.fecha_nacimiento,
  rol: p.rol || 'PACIENTE',
  esProvisoria: p.es_provisoria,
});

const mapTurno = (t: any): any => ({
  id: t.id,
  pacienteId: t.paciente_id,
  doctorId: t.doctor_id,
  pacienteNombre: t.paciente_nombre,
  pacienteDni: t.paciente_dni,
  pacienteEdad: t.paciente_edad ? `${t.paciente_edad} años` : '-',
  doctor: {
    id: t.doctor_id,
    nombreEmpleado: t.doctor_nombre,
    especialidad: { codEspecialidad: t.especialidad_cod, nombreEspecialidad: t.especialidad_nombre },
  },
  consultorio: { nombreConsultorio: t.consultorio_nombre, id: t.consultorio_id },
  fechaHoraPlanificado: t.fecha_hora_planificado,
  estado: t.estado,
  confirmado: t.confirmado,
  descripcion: t.descripcion,
});

const mapConsultorio = (c: any) => ({
  id: c.id,
  codConsultorio: c.cod_consultorio,
  nombreConsultorio: c.nombre_consultorio,
  localidad: { nombreLocalidad: c.localidad_nombre || '' },
});

const mapSala = (s: any) => ({
  id: s.id,
  codSala: s.cod_sala,
  nombreSala: s.nombre_sala,
  consultorioId: s.consultorio_id,
});

const mapEspecialidad = (e: any) => ({
  id: e.id,
  codEspecialidad: e.cod_especialidad,
  nombreEspecialidad: e.nombre_especialidad,
});

// ── Auth ─────────────────────────────────────────────
export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const userStr = data.usuario.trim();

    // 1. Buscar en admins
    const { data: admins } = await supabase
      .from('admins_consultorio')
      .select('*')
      .eq('usuario', userStr)
      .limit(1);
    if (admins && admins.length > 0) {
      const a = mapAdmin(admins[0]);
      if (a.contrasena !== data.contrasena) throw new Error('Credenciales incorrectas');
      return { id: a.id, usuario: a.usuario, nombre: a.nombreEmpleado, rol: 'ADMIN_CONSULTORIO', token: 'mock-token', forcePasswordChange: false, consultorioId: a.consultorioId } as LoginResponse;
    }

    // 2. Buscar en secretarios
    const { data: secs } = await supabase
      .from('secretarios')
      .select('*')
      .eq('usuario', userStr)
      .limit(1);
    if (secs && secs.length > 0) {
      const s = mapSecretario(secs[0]);
      if (s.contrasena !== data.contrasena) throw new Error('Credenciales incorrectas');
      return { id: s.id, usuario: s.usuario, nombre: s.nombreEmpleado, rol: 'SECRETARIO', token: 'mock-token', forcePasswordChange: s.esProvisoria === true, consultorioId: s.consultorioId } as LoginResponse;
    }

    // 3. Buscar en doctores
    const { data: docs } = await supabase
      .from('doctores')
      .select('*')
      .eq('usuario', userStr)
      .limit(1);
    if (docs && docs.length > 0) {
      const d = mapDoctor(docs[0]);
      if (d.contrasena !== data.contrasena) throw new Error('Credenciales incorrectas');
      return { id: d.id, usuario: d.usuario, nombre: d.nombreEmpleado, rol: 'DOCTOR', token: 'mock-token', forcePasswordChange: d.esProvisoria === true, consultorioId: d.consultorioId } as LoginResponse;
    }

    // 4. Buscar en pacientes
    const { data: pacs } = await supabase
      .from('pacientes')
      .select('*')
      .eq('usuario', userStr)
      .limit(1);
    if (pacs && pacs.length > 0) {
      const p = mapPaciente(pacs[0]);
      if (p.contrasena !== data.contrasena) throw new Error('Credenciales incorrectas');
      return { id: p.id, usuario: p.usuario, nombre: p.nombrePaciente, rol: 'PACIENTE', token: 'mock-token', forcePasswordChange: false, edad: p.edad, fechaNacimiento: p.fechaNacimiento } as LoginResponse;
    }

    throw { response: { status: 401, data: 'Usuario o contraseña incorrectos' } };
  },

  registerPaciente: async (data: RegisterPacienteRequest) => {
    const { error } = await supabase.from('pacientes').insert({
      usuario: data.usuario,
      contrasena: data.contrasena,
      nombre_paciente: data.nombrePaciente,
      dni_paciente: data.dniPaciente || null,
      nro_telefono: (data as any).nroTelefonoPaciente || null,
      edad: (data as any).edad || null,
      fecha_nacimiento: (data as any).fechaNacimiento || null,
      rol: 'PACIENTE',
      es_provisoria: false,
    });
    if (error) throw { response: { data: error.message } };
    return 'OK';
  },

  registerEmpleado: (data: { usuario: string; contrasena: string; nombreEmpleado: string; rol: string; nroTelefono?: string; codEspecialidad?: string }) =>
    api.post<string>('/auth/register-empleado', data).then((r) => r.data),

  changeCredentials: async (oldPassword: string, newPassword: string, newUsername?: string) => {
    const currentUser = JSON.parse(localStorage.getItem('sage_user') || '{}');
    if (!currentUser?.rol) throw new Error('No hay sesión activa');

    let table = '';
    if (currentUser.rol === 'ADMIN_CONSULTORIO') table = 'admins_consultorio';
    if (currentUser.rol === 'SECRETARIO') table = 'secretarios';
    if (currentUser.rol === 'DOCTOR') table = 'doctores';
    if (currentUser.rol === 'PACIENTE') table = 'pacientes';

    if (!table) throw new Error('Rol no reconocido');

    const updates: any = { contrasena: newPassword, es_provisoria: false };
    if (newUsername) updates.usuario = newUsername;

    const { error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', currentUser.id);

    if (error) throw { response: { data: error.message } };
    return 'OK';
  },
};

// ── Turnos ───────────────────────────────────────────
export const turnoApi = {
  solicitar: (data: SolicitudTurnoRequest) =>
    api.post<Turno>('/api/turnos', data).then((r) => r.data),
  reasignar: (turnoId: number, nuevaFechaHora: string) =>
    api.put<Turno>(`/api/turnos/${turnoId}/reasignar?nuevaFechaHora=${nuevaFechaHora}`).then((r) => r.data),
  confirmar: (turnoId: number) =>
    api.put<string>(`/api/turnos/${turnoId}/confirmar`).then((r) => r.data),
  marcarPresente: (turnoId: number) =>
    api.put<Consulta>(`/api/turnos/${turnoId}/presente`).then((r) => r.data),
};

// ── Consultas ────────────────────────────────────────
export const consultaApi = {
  ingresarUrgencia: (pacienteId: number, doctorId: number, descripcion: string) =>
    api.post<Consulta>(
      `/api/consultas/urgencias?pacienteId=${pacienteId}&doctorId=${doctorId}&descripcion=${encodeURIComponent(descripcion)}`
    ).then((r) => r.data),
  priorizar: (consultaId: number, prioridad: number) =>
    api.put<string>(`/api/consultas/urgencias/${consultaId}/priorizar?prioridad=${prioridad}`).then((r) => r.data),
  avanzar: (consultaId: number, diagnostico?: string, tratamiento?: string, observaciones?: string) => {
    const params = new URLSearchParams();
    if (diagnostico) params.append('diagnostico', diagnostico);
    if (tratamiento) params.append('tratamiento', tratamiento);
    if (observaciones) params.append('observaciones', observaciones);
    return api.put<Consulta>(`/api/consultas/${consultaId}/avanzar?${params}`).then((r) => r.data);
  },
};

// ── Doctores ─────────────────────────────────────────
export const doctorApi = {
  configurar: async (data: ConfigurarDoctorRequest) => {
    const currentUser = JSON.parse(localStorage.getItem('sage_user') || '{}');
    if (currentUser?.rol === 'DOCTOR') {
      const updates: any = {
        configuracion: data,
        es_provisoria: false,
      };
      if (data.edadMinima !== undefined) updates.edad_minima = data.edadMinima;
      if (data.edadMaxima !== undefined) updates.edad_maxima = data.edadMaxima;
      if (data.sexo) updates.sexo = data.sexo;

      const { error } = await supabase
        .from('doctores')
        .update(updates)
        .eq('id', currentUser.id);

      if (error) throw { response: { data: error.message } };
      return 'OK';
    }
    return api.put<string>('/api/doctores/configurar', data).then((r) => r.data);
  },

  listarPorConsultorio: (consultorioId: number) =>
    api.get<Doctor[]>(`/api/consultorio/${consultorioId}/doctores`).then((r) => r.data),
};

// ── Admin ABMs ───────────────────────────────────────
export const adminApi = {
  getZonas: async (): Promise<any[]> => [
    { id: 1, codZona: 'Z1', nombreZona: 'Mendoza Centro', fechaDesde: '2020-01-01' },
    { id: 2, codZona: 'Z2', nombreZona: 'Gran Mendoza', fechaDesde: '2020-01-01' },
  ],
  createZona: async (data: { codZona: string; nombreZona: string }) => ({ id: Date.now(), ...data }),

  getLocalidades: async (): Promise<any[]> => [
    { id: 1, codLocalidad: 'L1', nombreLocalidad: 'Capital', fechaDesde: '2020-01-01', zona: { id: 1, codZona: 'Z1', nombreZona: 'Mendoza Centro', fechaDesde: '2020-01-01' } },
    { id: 2, codLocalidad: 'L2', nombreLocalidad: 'Godoy Cruz', fechaDesde: '2020-01-01', zona: { id: 2, codZona: 'Z2', nombreZona: 'Gran Mendoza', fechaDesde: '2020-01-01' } },
  ],
  createLocalidad: async (data: { codLocalidad: string; nombreLocalidad: string; zonaId: number }) => ({ id: Date.now(), ...data }),

  getConsultorios: async (): Promise<Consultorio[]> => {
    const { data, error } = await supabase.from('consultorios').select('*').order('id');
    if (error || !data) return [];
    return data.map(mapConsultorio) as Consultorio[];
  },
  createConsultorio: async (data: { codConsultorio: string; nombreConsultorio: string; direccionConsultorio?: string; localidadId: number }) => {
    const { data: res, error } = await supabase.from('consultorios').insert({
      cod_consultorio: data.codConsultorio,
      nombre_consultorio: data.nombreConsultorio,
      localidad_nombre: '',
    }).select().single();
    if (error) throw error;
    return mapConsultorio(res);
  },

  getObrasSociales: async (): Promise<ObraSocial[]> => [],
  createObraSocial: async (data: { codObraSocial: string; nombreObraSocial: string }) => ({ id: Date.now(), ...data }),

  getEspecialidades: async (): Promise<Especialidad[]> => {
    const { data, error } = await supabase.from('especialidades').select('*').order('id');
    if (error || !data) return [];
    return data.map(mapEspecialidad) as Especialidad[];
  },
  createEspecialidad: async (data: { codEspecialidad: string; nombreEspecialidad: string }) => {
    const { data: res, error } = await supabase.from('especialidades').insert({
      cod_especialidad: data.codEspecialidad,
      nombre_especialidad: data.nombreEspecialidad,
    }).select().single();
    if (error) throw error;
    return mapEspecialidad(res);
  },

  getTiposTurno: async (): Promise<TipoTurno[]> => [],
  createTipoTurno: async (data: { codTipoTurno: string; nombreTipoTurno: string }) => ({ id: Date.now(), ...data }),

  getEstadosConsulta: async (): Promise<EstadoConsulta[]> => [],
  createEstadoConsulta: async (data: { codEc: string; nombreEc: string }) => ({ id: Date.now(), ...data }),

  getAdminsConsultorio: async () => {
    const { data } = await supabase.from('admins_consultorio').select('*');
    return (data || []).map(mapAdmin);
  },
  crearAdminConsultorio: async (data: { usuario: string; contrasena: string; nombreEmpleado: string; nroTelefono?: string; consultorioId: number }) => {
    const { data: res, error } = await supabase.from('admins_consultorio').insert({
      usuario: data.usuario,
      contrasena: data.contrasena,
      nombre_empleado: data.nombreEmpleado,
      consultorio_id: data.consultorioId,
      es_provisoria: true,
    }).select().single();
    if (error) throw { response: { data: error.message } };
    return mapAdmin(res);
  },
};

// ── Consultorio Admin ────────────────────────────────
export const consultorioAdminApi = {
  getSecretarios: async () => {
    const cId = JSON.parse(localStorage.getItem('sage_user') || '{}').consultorioId;
    const { data } = await supabase.from('secretarios').select('*').eq('consultorio_id', cId);
    return (data || []).map(mapSecretario);
  },

  getDoctores: async () => {
    const cId = JSON.parse(localStorage.getItem('sage_user') || '{}').consultorioId;
    const { data } = await supabase.from('doctores').select('*').eq('consultorio_id', cId);
    return (data || []).map(mapDoctor);
  },

  crearSecretario: async (data: { usuario: string; contrasena: string; nombreEmpleado: string; nroTelefono?: string; codSecretario: string }) => {
    const cId = JSON.parse(localStorage.getItem('sage_user') || '{}').consultorioId;
    const { data: res, error } = await supabase.from('secretarios').insert({
      usuario: data.usuario,
      contrasena: data.contrasena,
      nombre_empleado: data.nombreEmpleado,
      nro_telefono: data.nroTelefono || null,
      cod_secretario: data.codSecretario,
      consultorio_id: cId,
      es_provisoria: true,
    }).select().single();
    if (error) throw { response: { data: error.message } };
    return mapSecretario(res);
  },

  crearDoctor: async (data: { usuario: string; contrasena: string; nombreEmpleado: string; nroTelefono?: string; codDoctor: string; sexo?: 'FEMENINO' | 'MASCULINO' | 'PREFIERO_NO_DECIRLO' }) => {
    const cId = JSON.parse(localStorage.getItem('sage_user') || '{}').consultorioId;
    const { data: res, error } = await supabase.from('doctores').insert({
      usuario: data.usuario,
      contrasena: data.contrasena,
      nombre_empleado: data.nombreEmpleado,
      nro_telefono: data.nroTelefono || null,
      cod_doctor: data.codDoctor,
      consultorio_id: cId,
      es_provisoria: true,
      sexo: data.sexo || 'PREFIERO_NO_DECIRLO',
    }).select().single();
    if (error) throw { response: { data: error.message } };
    return mapDoctor(res);
  },

  getSalas: async () => {
    const cId = JSON.parse(localStorage.getItem('sage_user') || '{}').consultorioId;
    const { data } = await supabase.from('salas').select('*').eq('consultorio_id', cId);
    return (data || []).map(mapSala);
  },

  crearSala: async (data: { codSala: string; nombreSala: string }) => {
    const cId = JSON.parse(localStorage.getItem('sage_user') || '{}').consultorioId;
    const { data: res, error } = await supabase.from('salas').insert({
      cod_sala: data.codSala,
      nombre_sala: data.nombreSala,
      consultorio_id: cId,
    }).select().single();
    if (error) throw { response: { data: error.message } };
    return mapSala(res);
  },

  asignarAgendaDoctor: async (doctorId: number, agenda: any[]) => {
    // Validar solapamientos leyendo todos los doctores del consultorio
    const cId = JSON.parse(localStorage.getItem('sage_user') || '{}').consultorioId;
    const { data: todosDocsCon } = await supabase.from('doctores').select('*').eq('consultorio_id', cId);
    const todosDoc = (todosDocsCon || []).map(mapDoctor);

    for (const ag of agenda) {
      if (!ag.salaId) continue;
      const inicioNuevo = parseInt(ag.horaInicio.replace(':', ''));
      const finNuevo = parseInt(ag.horaFin.replace(':', ''));

      for (const d of todosDoc) {
        if (d.id === doctorId) continue;
        const configsAg = d.configuracion?.agenda || [];
        for (const existingAg of configsAg) {
          if (existingAg.diaSemana === ag.diaSemana && Number(existingAg.salaId) === Number(ag.salaId)) {
            const inicioExt = parseInt(existingAg.horaInicio.replace(':', ''));
            const finExt = parseInt(existingAg.horaFin.replace(':', ''));
            if (inicioNuevo < finExt && finNuevo > inicioExt) {
              return Promise.reject({ response: { data: `Solapamiento de horario en la sala seleccionada con el médico: ${d.nombreEmpleado}` } });
            }
          }
        }
      }
    }

    // Obtener configuracion actual y mergear agenda
    const { data: docData } = await supabase.from('doctores').select('configuracion').eq('id', doctorId).single();
    const configActual = docData?.configuracion || {};
    configActual.agenda = agenda;

    const { error } = await supabase.from('doctores').update({ configuracion: configActual }).eq('id', doctorId);
    if (error) throw { response: { data: error.message } };
    return 'OK';
  },
};

// ── Turno helpers (para PacienteDashboard, DoctorDashboard, SecretarioDashboard) ──
export const turnoSupabaseApi = {
  getTurnosByPaciente: async (pacienteId: number): Promise<any[]> => {
    const { data } = await supabase
      .from('turnos')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('fecha_hora_planificado', { ascending: false });
    return (data || []).map(mapTurno);
  },

  getTurnosByDoctor: async (doctorId: number): Promise<any[]> => {
    const { data } = await supabase
      .from('turnos')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('fecha_hora_planificado', { ascending: true });
    return (data || []).map(mapTurno);
  },

  getTurnosByConsultorio: async (consultorioId: number): Promise<any[]> => {
    const { data } = await supabase
      .from('turnos')
      .select('*')
      .eq('consultorio_id', consultorioId)
      .order('fecha_hora_planificado', { ascending: true });
    return (data || []).map(mapTurno);
  },

  crearTurno: async (turno: {
    pacienteId: number;
    doctorId: number;
    pacienteNombre: string;
    pacienteDni: string | number;
    pacienteEdad?: number;
    doctorNombre: string;
    especialidadCod: string;
    especialidadNombre: string;
    consultorioNombre: string;
    consultorioId: number;
    fechaHoraPlanificado: string;
    descripcion?: string;
  }): Promise<any> => {
    const { data, error } = await supabase.from('turnos').insert({
      paciente_id: turno.pacienteId,
      doctor_id: turno.doctorId,
      paciente_nombre: turno.pacienteNombre,
      paciente_dni: String(turno.pacienteDni),
      paciente_edad: turno.pacienteEdad || null,
      doctor_nombre: turno.doctorNombre,
      especialidad_cod: turno.especialidadCod,
      especialidad_nombre: turno.especialidadNombre,
      consultorio_nombre: turno.consultorioNombre,
      consultorio_id: turno.consultorioId,
      fecha_hora_planificado: turno.fechaHoraPlanificado,
      descripcion: turno.descripcion || '',
      estado: 'PENDIENTE',
      confirmado: false,
    }).select().single();

    if (error) throw { response: { data: error.message } };
    return mapTurno(data);
  },

  actualizarEstadoTurno: async (turnoId: number, estado: string): Promise<void> => {
    const { error } = await supabase.from('turnos').update({ estado }).eq('id', turnoId);
    if (error) throw error;
  },

  getDoctoresTodos: async (): Promise<any[]> => {
    const { data } = await supabase.from('doctores').select('*');
    return (data || []).map(mapDoctor);
  },

  getPacienteTodos: async (): Promise<any[]> => {
    const { data } = await supabase.from('pacientes').select('*');
    return (data || []).map(mapPaciente);
  },
};

// ── Agenda ───────────────────────────────────────────
export const agendaApi = {
  getSlotsDisponibles: (doctorId: number, fecha: string) =>
    api.get<string[]>(`/api/agenda/${doctorId}/slots?fecha=${fecha}`).then((r) => r.data),
};

export default api;
