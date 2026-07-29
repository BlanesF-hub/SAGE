/* ============================================================
   SAGE — TypeScript Types (mirrors backend entities)
   ============================================================ */

// ── Enums ─────────────────────────────────────────
export type Rol = 'ADMIN_GENERAL' | 'ADMIN_CONSULTORIO' | 'SECRETARIO' | 'DOCTOR' | 'PACIENTE';

export type EstadoTurno =
  | 'LIBRE'
  | 'ASIGNADO'
  | 'CONFIRMADO'
  | 'REASIGNADO'
  | 'PRESENTE'
  | 'EN_CONSULTA'
  | 'FINALIZADO'
  | 'CANCELADO'
  | 'AUSENTE';

export type TipoPaciente = 'PARTICULAR' | 'OBRA_SOCIAL' | 'PAMI';

// ── Geographical ──────────────────────────────────
export interface Zona {
  id: number;
  codZona: string;
  nombreZona: string;
  fechaDesde: string;
  fechaHasta?: string;
}

export interface Localidad {
  id: number;
  codLocalidad: string;
  nombreLocalidad: string;
  fechaDesde: string;
  fechaHasta?: string;
  zona: Zona;
}

// ── Parametric ────────────────────────────────────
export interface ObraSocial {
  id: number;
  codObraSocial: string;
  nombreObraSocial: string;
  fechaDesde: string;
  fechaHasta?: string;
}

export interface Especialidad {
  id: number;
  codEspecialidad: string;
  nombreEspecialidad: string;
  fechaDesde: string;
  fechaHasta?: string;
}

export interface TipoTurno {
  id: number;
  codTipoTurno: string;
  nombreTipoTurno: string;
  fechaHoraBaja?: string;
}

export interface EstadoConsulta {
  id: number;
  codEc: string;
  nombreEc: string;
  fechaHoraBaja?: string;
}

// ── Consultorio ───────────────────────────────────
export interface Consultorio {
  id: number;
  codConsultorio: string;
  nombreConsultorio: string;
  direccionConsultorio?: string;
  fechaDesde: string;
  fechaHasta?: string;
  localidad: Localidad;
}

// ── Empleado ──────────────────────────────────────
export interface Empleado {
  id: number;
  usuario: string;
  nombreEmpleado: string;
  nroTelefono?: string;
  fechaDesdeEmpleado: string;
  fechaHastaEmpleado?: string;
  rol: Rol;
  forcePasswordChange: boolean;
  consultorio?: Consultorio;
}

export interface Secretario extends Empleado {
  codSecretario: string;
}

export interface Doctor extends Empleado {
  codDoctor: string;
  especialidad?: Especialidad;
  edadMinima?: number;
  edadMaxima?: number;
  agendas: AgendaDoctor[];
}

export interface AgendaDoctor {
  id: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  tiempoMaximoEspera: number;
  activa: boolean;
}

// ── Paciente ──────────────────────────────────────
export interface Paciente {
  id: number;
  tipoPaciente: TipoPaciente;
  codPaciente: string;
  nombrePaciente: string;
  usuario: string;
  dniPaciente: number;
  nroTelefonoPaciente?: string;
  fechaNacimiento: string;
  direccionPaciente?: string;
  fechaHoraAlta: string;
  fechaHoraBaja?: string;
  nroAfiliado?: number;
  obraSocial?: ObraSocial;
  nroBeneficiario?: number;
}

// ── Turno ─────────────────────────────────────────
export interface Turno {
  id: number;
  nroTurno?: number;
  fechaHoraPlanificado: string;
  fechaHoraInicio?: string;
  fechaHoraFin?: string;
  descripcionTurno?: string;
  estado: EstadoTurno;
  confirmado: boolean;
  recordatorioEnviado: boolean;
  prioridadUrgencia?: number;
  tipoTurno: TipoTurno;
  paciente?: Paciente;
  doctor: Doctor;
}

// ── Consulta ──────────────────────────────────────
export interface ConsultaEstadoHistorial {
  id: number;
  estadoConsulta: EstadoConsulta;
  ordenCe: number;
  fechaHoraInicio: string;
  fechaFin?: string;
}

export interface Consulta {
  id: number;
  nroConsulta?: number;
  turno: Turno;
  fechaHoraInicioConsulta?: string;
  fechaHoraFinConsulta?: string;
  diagnosticoConsulta?: string;
  tratamientoConsulta?: string;
  observacionesConsulta?: string;
  estados: ConsultaEstadoHistorial[];
}

// ── Auth DTOs ─────────────────────────────────────
export interface LoginRequest {
  usuario: string;
  contrasena: string;
}

export interface LoginResponse {
  token: string;
  rol: Rol;
  nombre: string;
  id: number;
  forcePasswordChange: boolean;
  consultorio?: Consultorio;
}

export interface RegisterPacienteRequest {
  usuario: string;
  contrasena: string;
  nombrePaciente: string;
  dniPaciente: number;
  nroTelefonoPaciente?: string;
  fechaNacimiento: string;
  direccionPaciente?: string;
  tipoPaciente: TipoPaciente;
  nroAfiliado?: number;
  obraSocialId?: number;
  nroBeneficiario?: number;
}

export interface SolicitudTurnoRequest {
  pacienteId: number;
  doctorId: number;
  fechaHora: string;
  descripcion?: string;
}

export interface ConfigurarDoctorRequest {
  codEspecialidad: string;
  edadMinima?: number;
  edadMaxima?: number;
  agenda: AgendaInput[];
}

export interface AgendaInput {
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  tiempoMaximoEspera: number;
}
