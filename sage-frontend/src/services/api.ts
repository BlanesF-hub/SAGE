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
  baseURL: '', // uses Vite proxy in dev
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
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sage_token');
      localStorage.removeItem('sage_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────
export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data).then((r) => r.data),

  registerPaciente: (data: RegisterPacienteRequest) =>
    api.post<string>('/auth/register-paciente', data).then((r) => r.data),

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

// ── Admin ABMs ───────────────────────────────────────
export const adminApi = {
  // Zonas
  getZonas: () => api.get<Zona[]>('/api/admin/zonas').then((r) => r.data),
  createZona: (data: { codZona: string; nombreZona: string }) =>
    api.post<Zona>('/api/admin/zonas', data).then((r) => r.data),

  // Localidades
  getLocalidades: () => api.get<Localidad[]>('/api/admin/localidades').then((r) => r.data),
  createLocalidad: (data: { codLocalidad: string; nombreLocalidad: string; zonaId: number }) =>
    api.post<Localidad>('/api/admin/localidades', data).then((r) => r.data),

  // Consultorios
  getConsultorios: () => api.get<Consultorio[]>('/api/admin/consultorios').then((r) => r.data),
  createConsultorio: (data: { codConsultorio: string; nombreConsultorio: string; direccionConsultorio?: string; localidadId: number }) =>
    api.post<Consultorio>('/api/admin/consultorios', data).then((r) => r.data),

  // Obras Sociales
  getObrasSociales: () => api.get<ObraSocial[]>('/api/admin/obras-sociales').then((r) => r.data),
  createObraSocial: (data: { codObraSocial: string; nombreObraSocial: string }) =>
    api.post<ObraSocial>('/api/admin/obras-sociales', data).then((r) => r.data),

  // Especialidades
  getEspecialidades: () => api.get<Especialidad[]>('/api/admin/especialidades').then((r) => r.data),
  createEspecialidad: (data: { codEspecialidad: string; nombreEspecialidad: string }) =>
    api.post<Especialidad>('/api/admin/especialidades', data).then((r) => r.data),

  // Tipos Turno
  getTiposTurno: () => api.get<TipoTurno[]>('/api/admin/tipos-turno').then((r) => r.data),
  createTipoTurno: (data: { codTipoTurno: string; nombreTipoTurno: string }) =>
    api.post<TipoTurno>('/api/admin/tipos-turno', data).then((r) => r.data),

  // Estados Consulta
  getEstadosConsulta: () => api.get<EstadoConsulta[]>('/api/admin/estados-consulta').then((r) => r.data),
  createEstadoConsulta: (data: { codEc: string; nombreEc: string }) =>
    api.post<EstadoConsulta>('/api/admin/estados-consulta', data).then((r) => r.data),

  // Admin Consultorio
  crearAdminConsultorio: (data: { usuario: string; nombreEmpleado: string; nroTelefono?: string; consultorioId: number }) =>
    api.post('/api/admin/admins-consultorio', data).then((r) => r.data),
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
