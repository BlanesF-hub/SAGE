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

    // 2. Buscar en la BD mock local
    const admins = getLocal<any>('mock_admins_consultorio');
    const secretarios = getLocal<any>('mock_secretarios');
    const doctores = getLocal<any>('mock_doctores');
    const pacientes = getLocal<any>('mock_pacientes');
    
    let matchedUser = null;
    let matchedRol = '';
    
    const admin = admins.find((a) => a.usuario.trim() === userStr);
    if (admin) { matchedUser = admin; matchedRol = 'ADMIN_CONSULTORIO'; }
    
    if (!matchedUser) {
      const sec = secretarios.find((s) => s.usuario.trim() === userStr);
      if (sec) { matchedUser = sec; matchedRol = 'SECRETARIO'; }
    }
    
    if (!matchedUser) {
      const doc = doctores.find((d) => d.usuario.trim() === userStr);
      if (doc) { matchedUser = doc; matchedRol = 'DOCTOR'; }
    }

    if (!matchedUser) {
      const pac = pacientes.find((p) => p.usuario.trim() === userStr);
      if (pac) { matchedUser = pac; matchedRol = 'PACIENTE'; }
    }
    
    if (matchedUser) {
      const userPass = matchedUser.contrasena || 'sage123';
      if (userPass === data.contrasena) {
        // Pacientes nunca tienen forcePasswordChange, ya eligieron sus credenciales al registrarse
        const isPaciente = matchedRol === 'PACIENTE';
        const isForce = isPaciente ? false : matchedUser.esProvisoria !== false;
        return {
          id: matchedUser.id,
          usuario: matchedUser.usuario,
          nombre: matchedUser.nombrePaciente || matchedUser.nombreEmpleado,
          rol: matchedRol,
          token: 'mock-token-' + matchedUser.id,
          forcePasswordChange: isForce,
          consultorioId: matchedUser.consultorioId,
        } as LoginResponse;
      }
    }

    // 3. Si no está local, intentar ir al backend (fallará en Vercel sin API)
    return api.post<LoginResponse>('/auth/login', data).then((r) => r.data);
  },

  registerPaciente: async (data: RegisterPacienteRequest) => {
    saveMock('mock_pacientes', { ...data, rol: 'PACIENTE', esProvisoria: false });
    return 'OK';
  },

  registerEmpleado: (data: { usuario: string; contrasena: string; nombreEmpleado: string; rol: string; nroTelefono?: string; codEspecialidad?: string }) =>
    api.post<string>('/auth/register-empleado', data).then((r) => r.data),

  changeCredentials: async (oldPassword: string, newPassword: string, newUsername?: string) => {
    // 1. Intentar actualizar en mock local
    const currentUser = JSON.parse(localStorage.getItem('sage_user') || '{}');
    if (currentUser?.rol) {
      let key = '';
      if (currentUser.rol === 'ADMIN_CONSULTORIO') key = 'mock_admins_consultorio';
      if (currentUser.rol === 'SECRETARIO') key = 'mock_secretarios';
      if (currentUser.rol === 'DOCTOR') key = 'mock_doctores';
      
      if (key) {
        const items = getLocal<any>(key);
        const idx = items.findIndex((a) => a.id === currentUser.id);
        if (idx !== -1) {
          if (newUsername) items[idx].usuario = newUsername;
          items[idx].contrasena = newPassword;
          items[idx].esProvisoria = false;
          setLocal(key, items);
          return 'OK';
        }
      }
    }
    // 2. Fallback al backend real
    return api.put<string>('/auth/change-credentials', { oldPassword, newPassword, newUsername }).then((r) => r.data);
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
      const doctores = getLocal<any>('mock_doctores');
      const idx = doctores.findIndex((d) => d.id === currentUser.id);
      if (idx !== -1) {
        doctores[idx].configuracion = data;
        setLocal('mock_doctores', doctores);
        return 'OK';
      }
    }
    return api.put<string>('/api/doctores/configurar', data).then((r) => r.data);
  },

  listarPorConsultorio: (consultorioId: number) =>
    api.get<Doctor[]>(`/api/consultorio/${consultorioId}/doctores`).then((r) => r.data),
};

// ── Seed Data por defecto para dispositivos/navegadores nuevos ──
const SEED_DATA: Record<string, any[]> = {
  mock_zonas: [
    { id: 1, codZona: 'Z1', nombreZona: 'Mendoza Centro' },
    { id: 2, codZona: 'Z2', nombreZona: 'Gran Mendoza' },
  ],
  mock_localidades: [
    { id: 1, codLocalidad: 'L1', nombreLocalidad: 'Capital', zona: { id: 1, codZona: 'Z1', nombreZona: 'Mendoza Centro' } },
    { id: 2, codLocalidad: 'L2', nombreLocalidad: 'Godoy Cruz', zona: { id: 2, codZona: 'Z2', nombreZona: 'Gran Mendoza' } },
  ],
  mock_consultorios: [
    { id: 1, codConsultorio: 'C001', nombreConsultorio: 'Clínica San Gabriel', direccionConsultorio: 'Av. San Martín 1050', localidad: { id: 1, codLocalidad: 'L1', nombreLocalidad: 'Capital' } },
    { id: 2, codConsultorio: 'C002', nombreConsultorio: 'Centro Médico Salud & Vida', direccionConsultorio: 'Calle Belgrano 450', localidad: { id: 2, codLocalidad: 'L2', nombreLocalidad: 'Godoy Cruz' } },
  ],
  mock_especialidades: [
    { id: 1, codEspecialidad: 'CARDIO', nombreEspecialidad: 'Cardiología' },
    { id: 2, codEspecialidad: 'PEDIATRIA', nombreEspecialidad: 'Pediatría' },
    { id: 3, codEspecialidad: 'CLINICA', nombreEspecialidad: 'Clínica General' },
    { id: 4, codEspecialidad: 'TRAUMA', nombreEspecialidad: 'Traumatología' },
  ],
  mock_admins_consultorio: [
    { id: 10, usuario: 'admin_sangabriel', contrasena: 'admin123', nombreEmpleado: 'Gladys Aruta (Admin San Gabriel)', consultorioId: 1, esProvisoria: false },
    { id: 11, usuario: 'admin_saludvida', contrasena: 'admin123', nombreEmpleado: 'Carlos López (Admin Salud)', consultorioId: 2, esProvisoria: false },
  ],
  mock_salas: [
    { id: 1, codSala: 'BOX-101', nombreSala: 'Consultorio 101 (Pediatría)', consultorioId: 1 },
    { id: 2, codSala: 'BOX-102', nombreSala: 'Consultorio 102 (Cardiología)', consultorioId: 1 },
    { id: 3, codSala: 'BOX-A', nombreSala: 'Sala A (Clínica)', consultorioId: 2 },
  ],
  mock_doctores: [
    {
      id: 101,
      usuario: 'dr_perez',
      contrasena: 'doc123',
      nombreEmpleado: 'Dr. Juan Pérez',
      codDoctor: 'MAT-1001',
      consultorioId: 1,
      esProvisoria: false,
      configuracion: {
        codEspecialidad: 'CARDIO',
        agenda: [
          { diaSemana: 1, horaInicio: '08:00', horaFin: '12:00', tiempoMaximoEspera: 15, salaId: 2 },
          { diaSemana: 3, horaInicio: '08:00', horaFin: '12:00', tiempoMaximoEspera: 15, salaId: 2 },
        ],
      },
    },
    {
      id: 102,
      usuario: 'dra_gomez',
      contrasena: 'doc123',
      nombreEmpleado: 'Dra. Ana Gómez',
      codDoctor: 'MAT-1002',
      consultorioId: 1,
      esProvisoria: false,
      configuracion: {
        codEspecialidad: 'PEDIATRIA',
        agenda: [
          { diaSemana: 2, horaInicio: '09:00', horaFin: '13:00', tiempoMaximoEspera: 15, salaId: 1 },
          { diaSemana: 4, horaInicio: '09:00', horaFin: '13:00', tiempoMaximoEspera: 15, salaId: 1 },
        ],
      },
    },
  ],
  mock_secretarios: [
    { id: 201, usuario: 'sec_marcela', contrasena: 'sec123', nombreEmpleado: 'Marcela Fernández', codSecretario: 'SEC-501', consultorioId: 1, esProvisoria: false },
  ],
  mock_pacientes: [
    { id: 301, usuario: 'paciente_juan', contrasena: 'pac123', nombrePaciente: 'Juan Pérez', dniPaciente: 35123456, rol: 'PACIENTE', esProvisoria: false },
  ],
};

// ── Funciones de ayuda para MOCK de BD Local ──
const getLocal = <T>(key: string): T[] => {
  const raw = localStorage.getItem(key);
  if (!raw) {
    const defaultData = SEED_DATA[key] || [];
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData as T[];
  }
  return JSON.parse(raw);
};
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
  crearAdminConsultorio: async (data: { usuario: string; contrasena: string; nombreEmpleado: string; nroTelefono?: string; consultorioId: number }) => {
    return saveMock('mock_admins_consultorio', { ...data, esProvisoria: true });
  },
};

// ── Consultorio Admin ────────────────────────────────
export const consultorioAdminApi = {
  getSecretarios: async () => {
    const cId = JSON.parse(localStorage.getItem('sage_user') || '{}').consultorioId;
    return getLocal<any>('mock_secretarios').filter((s) => s.consultorioId === cId);
  },
  getDoctores: async () => {
    const cId = JSON.parse(localStorage.getItem('sage_user') || '{}').consultorioId;
    return getLocal<any>('mock_doctores').filter((d) => d.consultorioId === cId);
  },
  crearSecretario: async (data: { usuario: string; contrasena: string; nombreEmpleado: string; nroTelefono?: string; codSecretario: string }) => {
    const cId = JSON.parse(localStorage.getItem('sage_user') || '{}').consultorioId;
    return saveMock('mock_secretarios', { ...data, consultorioId: cId, esProvisoria: true });
  },
  crearDoctor: async (data: { usuario: string; contrasena: string; nombreEmpleado: string; nroTelefono?: string; codDoctor: string }) => {
    const cId = JSON.parse(localStorage.getItem('sage_user') || '{}').consultorioId;
    return saveMock('mock_doctores', { ...data, consultorioId: cId, esProvisoria: true });
  },
  getSalas: async () => {
    const cId = JSON.parse(localStorage.getItem('sage_user') || '{}').consultorioId;
    return getLocal<any>('mock_salas').filter((s) => s.consultorioId === cId);
  },
  crearSala: async (data: { codSala: string; nombreSala: string }) => {
    const cId = JSON.parse(localStorage.getItem('sage_user') || '{}').consultorioId;
    return saveMock('mock_salas', { ...data, consultorioId: cId });
  },
  asignarAgendaDoctor: async (doctorId: number, agenda: any[]) => {
    const doctores = getLocal<any>('mock_doctores');
    
    // Validar solapamientos
    for (const ag of agenda) {
      if (!ag.salaId) continue;
      const inicioNuevo = parseInt(ag.horaInicio.replace(':', ''));
      const finNuevo = parseInt(ag.horaFin.replace(':', ''));
      
      for (const d of doctores) {
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
    
    const idx = doctores.findIndex((d) => d.id === doctorId);
    if (idx !== -1) {
       if (!doctores[idx].configuracion) doctores[idx].configuracion = {};
       doctores[idx].configuracion.agenda = agenda;
       setLocal('mock_doctores', doctores);
       return 'OK';
    }
    return Promise.reject({ response: { data: 'Doctor no encontrado' } });
  },
};

// ── Agenda ───────────────────────────────────────────
export const agendaApi = {
  getSlotsDisponibles: (doctorId: number, fecha: string) =>
    api.get<string[]>(`/api/agenda/${doctorId}/slots?fecha=${fecha}`).then((r) => r.data),
};

export default api;
