/* ============================================================
   SAGE — API Service Layer (Axios + JWT Interceptor)
   ============================================================ */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
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
  baseURL: import.meta.env.VITE_API_URL || '', // uses VITE_API_URL in production or Vite proxy in dev
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
    // Si la respuesta es un HTML (pasa en Vercel cuando no hay backend configurado), rechazar para evitar crasheos de .map()
    if (typeof response.data === 'string' && response.data.trim().toLowerCase().startsWith('<!doctype html>')) {
      return Promise.reject(new Error('Backend no conectado. Vercel retornó HTML.'));
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

// ── Auth ─────────────────────────────────────────────
export const authApi = {
  login: async (data: LoginRequest) => {
    const userStr = data.usuario.trim();
    
    // 1. Mock de DEMO_ACTORS
    if (userStr === 'secretario' && data.contrasena === 'admin123') return { id: 2, usuario: 'secretario', nombre: 'Secretario de Prueba', rol: 'ADMIN_CONSULTORIO', token: 'mock-token', forcePasswordChange: false, consultorioId: 1 } as LoginResponse;
    if (userStr === 'doctor' && data.contrasena === 'admin123') return { id: 3, usuario: 'doctor', nombre: 'Dr. Prueba', rol: 'DOCTOR', token: 'mock-token', forcePasswordChange: false, consultorioId: 1 } as LoginResponse;
    if (userStr === 'paciente' && data.contrasena === 'admin123') return { id: 4, usuario: 'paciente', nombre: 'Paciente Prueba', rol: 'PACIENTE', token: 'mock-token', forcePasswordChange: false } as LoginResponse;

    // 2. Buscar en la BD mock local (ej. administradores creados por el superadmin)
    const admins = getLocal<any>('mock_admins_consultorio');
    const admin = admins.find((a) => a.usuario.trim() === userStr);
    
    if (admin && data.contrasena === 'sage123') {
      return {
        id: admin.id,
        usuario: admin.usuario,
        nombre: admin.nombreEmpleado,
        rol: 'ADMIN_CONSULTORIO',
        token: 'mock-token-' + admin.id,
        forcePasswordChange: false,
        consultorioId: admin.consultorioId,
      } as LoginResponse;
    }

    // 3. Si no está local, intentar ir al backend (fallará en Vercel sin API)
    return api.post<LoginResponse>('/auth/login', data).then((r) => r.data);
  },

  registerPaciente: (data: RegisterPacienteRequest) =>
    api.post<string>('/auth/register-paciente', data).then((r) => r.data),

  registerEmpleado: (data: { usuario: string; contrasena: string; nombreEmpleado: string; rol: string; nroTelefono?: string; codEspecialidad?: string }) =>
    api.post<string>('/auth/register-empleado', data).then((r) => r.data),

  changePassword: (oldPassword: string, newPassword: string) =>
    api.put<string>('/auth/change-password', { oldPassword, newPassword }).then((r) => r.data),
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
  configurar: (data: ConfigurarDoctorRequest) =>
    api.put<string>('/api/doctores/configurar', data).then((r) => r.data),

  listarPorConsultorio: (consultorioId: number) =>
    api.get<Doctor[]>(`/api/consultorio/${consultorioId}/doctores`).then((r) => r.data),
};

// ── Funciones de ayuda para MOCK de BD Local ──
const getLocal = <T>(key: string): T[] => JSON.parse(localStorage.getItem(key) || '[]');
const setLocal = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));
const saveMock = (key: string, data: any) => {
  const items = getLocal<any>(key);
  const newItem = { id: Date.now(), ...data, fechaDesde: new Date().toISOString() };
  items.push(newItem);
  setLocal(key, items);
  return newItem;
};

// ── Admin ABMs (MOCK LOCAL PARA DEMO) ───────────────────────────────────────
export const adminApi = {
  // Zonas
  getZonas: async () => getLocal<Zona>('mock_zonas'),
  createZona: async (data: { codZona: string; nombreZona: string }) => saveMock('mock_zonas', data),

  // Localidades
  getLocalidades: async () => getLocal<Localidad>('mock_localidades'),
  createLocalidad: async (data: { codLocalidad: string; nombreLocalidad: string; zonaId: number }) => {
    const zonas = getLocal<Zona>('mock_zonas');
    const zona = zonas.find((z) => z.id === data.zonaId);
    return saveMock('mock_localidades', { ...data, zona });
  },

  // Consultorios
  getConsultorios: async () => getLocal<Consultorio>('mock_consultorios'),
  createConsultorio: async (data: { codConsultorio: string; nombreConsultorio: string; direccionConsultorio?: string; localidadId: number }) => {
    const localidades = getLocal<Localidad>('mock_localidades');
    const localidad = localidades.find((l) => l.id === data.localidadId);
    return saveMock('mock_consultorios', { ...data, localidad });
  },

  // Obras Sociales
  getObrasSociales: async () => getLocal<ObraSocial>('mock_obras_sociales'),
  createObraSocial: async (data: { codObraSocial: string; nombreObraSocial: string }) => saveMock('mock_obras_sociales', data),

  // Especialidades
  getEspecialidades: async () => getLocal<Especialidad>('mock_especialidades'),
  createEspecialidad: async (data: { codEspecialidad: string; nombreEspecialidad: string }) => saveMock('mock_especialidades', data),

  // Tipos Turno
  getTiposTurno: async () => getLocal<TipoTurno>('mock_tipos_turno'),
  createTipoTurno: async (data: { codTipoTurno: string; nombreTipoTurno: string }) => saveMock('mock_tipos_turno', data),

  // Estados Consulta
  getEstadosConsulta: async () => getLocal<EstadoConsulta>('mock_estados_consulta'),
  createEstadoConsulta: async (data: { codEc: string; nombreEc: string }) => saveMock('mock_estados_consulta', data),

  // Admin Consultorio
  getAdminsConsultorio: async () => getLocal<any>('mock_admins_consultorio'),
  crearAdminConsultorio: async (data: { usuario: string; nombreEmpleado: string; nroTelefono?: string; consultorioId: number }) => {
    return saveMock('mock_admins_consultorio', data);
  },
};

// ── Consultorio Admin ────────────────────────────────
export const consultorioAdminApi = {
  crearSecretario: (data: { usuario: string; nombreEmpleado: string; nroTelefono?: string; codSecretario: string }) =>
    api.post('/api/consultorio/secretarios', data).then((r) => r.data),

  crearDoctor: (data: { usuario: string; nombreEmpleado: string; nroTelefono?: string; codDoctor: string }) =>
    api.post('/api/consultorio/doctores', data).then((r) => r.data),
};

// ── Agenda ───────────────────────────────────────────
export const agendaApi = {
  getSlotsDisponibles: (doctorId: number, fecha: string) =>
    api.get<string[]>(`/api/agenda/${doctorId}/slots?fecha=${fecha}`).then((r) => r.data),
};

export default api;
