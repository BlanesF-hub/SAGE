-- ============================================================
-- SAGE — Schema SQL para Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- ─── Consultorios ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consultorios (
  id BIGINT PRIMARY KEY,
  cod_consultorio TEXT UNIQUE NOT NULL,
  nombre_consultorio TEXT NOT NULL,
  localidad_nombre TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Especialidades ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS especialidades (
  id BIGINT PRIMARY KEY,
  cod_especialidad TEXT UNIQUE NOT NULL,
  nombre_especialidad TEXT NOT NULL
);

-- ─── Salas ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salas (
  id BIGINT PRIMARY KEY,
  cod_sala TEXT UNIQUE NOT NULL,
  nombre_sala TEXT NOT NULL,
  consultorio_id BIGINT REFERENCES consultorios(id)
);

-- ─── Admins de Consultorio ────────────────────────────────
CREATE TABLE IF NOT EXISTS admins_consultorio (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario TEXT UNIQUE NOT NULL,
  contrasena TEXT NOT NULL,
  nombre_empleado TEXT NOT NULL,
  consultorio_id BIGINT REFERENCES consultorios(id),
  es_provisoria BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Doctores ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctores (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario TEXT UNIQUE NOT NULL,
  contrasena TEXT NOT NULL,
  nombre_empleado TEXT NOT NULL,
  cod_doctor TEXT,
  nro_telefono TEXT,
  consultorio_id BIGINT REFERENCES consultorios(id),
  es_provisoria BOOLEAN DEFAULT TRUE,
  edad_minima INTEGER,
  edad_maxima INTEGER,
  sexo TEXT DEFAULT 'PREFIERO_NO_DECIRLO',
  configuracion JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Secretarios ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS secretarios (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario TEXT UNIQUE NOT NULL,
  contrasena TEXT NOT NULL,
  nombre_empleado TEXT NOT NULL,
  cod_secretario TEXT,
  nro_telefono TEXT,
  consultorio_id BIGINT REFERENCES consultorios(id),
  es_provisoria BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Pacientes ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pacientes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario TEXT UNIQUE NOT NULL,
  contrasena TEXT NOT NULL,
  nombre_paciente TEXT NOT NULL,
  dni_paciente BIGINT,
  nro_telefono TEXT,
  edad INTEGER,
  fecha_nacimiento DATE,
  rol TEXT DEFAULT 'PACIENTE',
  es_provisoria BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Turnos ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS turnos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  paciente_id BIGINT,
  doctor_id BIGINT,
  paciente_nombre TEXT,
  paciente_dni TEXT,
  paciente_edad INTEGER,
  doctor_nombre TEXT,
  especialidad_cod TEXT,
  especialidad_nombre TEXT,
  consultorio_nombre TEXT,
  consultorio_id BIGINT,
  fecha_hora_planificado TEXT NOT NULL,
  estado TEXT DEFAULT 'PENDIENTE',
  confirmado BOOLEAN DEFAULT FALSE,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Deshabilitar RLS o Permitir Acceso Público (Demo)
-- ============================================================
ALTER TABLE consultorios DISABLE ROW LEVEL SECURITY;
ALTER TABLE especialidades DISABLE ROW LEVEL SECURITY;
ALTER TABLE salas DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins_consultorio DISABLE ROW LEVEL SECURITY;
ALTER TABLE doctores DISABLE ROW LEVEL SECURITY;
ALTER TABLE secretarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE turnos DISABLE ROW LEVEL SECURITY;

-- Políticas de permiso total para cliente (anon / public)
DROP POLICY IF EXISTS "Allow public all consultorios" ON consultorios;
CREATE POLICY "Allow public all consultorios" ON consultorios FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all especialidades" ON especialidades;
CREATE POLICY "Allow public all especialidades" ON especialidades FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all salas" ON salas;
CREATE POLICY "Allow public all salas" ON salas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all admins_consultorio" ON admins_consultorio;
CREATE POLICY "Allow public all admins_consultorio" ON admins_consultorio FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all doctores" ON doctores;
CREATE POLICY "Allow public all doctores" ON doctores FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all secretarios" ON secretarios;
CREATE POLICY "Allow public all secretarios" ON secretarios FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all pacientes" ON pacientes;
CREATE POLICY "Allow public all pacientes" ON pacientes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all turnos" ON turnos;
CREATE POLICY "Allow public all turnos" ON turnos FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Datos Semilla (Seed) — Usuarios de Demo
-- ============================================================

-- Consultorios
INSERT INTO consultorios (id, cod_consultorio, nombre_consultorio, localidad_nombre) VALUES
  (1, 'CONS-001', 'Consultorios Médicos San Gabriel', 'Capital, Mendoza'),
  (2, 'CONS-002', 'Centro de Salud y Vida', 'Godoy Cruz, Mendoza')
ON CONFLICT (id) DO NOTHING;

-- Especialidades
INSERT INTO especialidades (id, cod_especialidad, nombre_especialidad) VALUES
  (1, 'CARDIO', 'Cardiología'),
  (2, 'PEDIATRIA', 'Pediatría'),
  (3, 'CLINICA', 'Clínica General'),
  (4, 'TRAUMA', 'Traumatología')
ON CONFLICT (id) DO NOTHING;

-- Salas
INSERT INTO salas (id, cod_sala, nombre_sala, consultorio_id) VALUES
  (1, 'BOX-101', 'Consultorio 101 (Pediatría)', 1),
  (2, 'BOX-102', 'Consultorio 102 (Cardiología)', 1),
  (3, 'BOX-A', 'Sala A (Clínica)', 2)
ON CONFLICT (id) DO NOTHING;

-- Admins de Consultorio
INSERT INTO admins_consultorio (usuario, contrasena, nombre_empleado, consultorio_id, es_provisoria) VALUES
  ('admin_sangabriel', 'admin123', 'Gladys Aruta (Admin San Gabriel)', 1, FALSE),
  ('admin_saludvida', 'admin123', 'Carlos López (Admin Salud)', 2, FALSE),
  ('Gladys123', 'admin123', 'Gladys Aruta (Admin General)', 1, FALSE)
ON CONFLICT (usuario) DO NOTHING;

-- Secretarios
INSERT INTO secretarios (usuario, contrasena, nombre_empleado, cod_secretario, consultorio_id, es_provisoria) VALUES
  ('sec_marcela', 'sec123', 'Marcela Fernández', 'SEC-501', 1, FALSE),
  ('secretario', 'admin123', 'Secretario de Prueba', 'SEC-001', 1, FALSE)
ON CONFLICT (usuario) DO NOTHING;

-- Doctores
INSERT INTO doctores (usuario, contrasena, nombre_empleado, cod_doctor, consultorio_id, es_provisoria, edad_minima, sexo, configuracion) VALUES
  ('doctor', 'admin123', 'Dra. Gladys Aruta', 'MAT-999', 1, FALSE, 18, 'FEMENINO',
   '{"codEspecialidad":"CLINICA","edadMinima":18,"sexo":"FEMENINO","agenda":[{"diaSemana":1,"horaInicio":"08:00","horaFin":"13:00","tiempoMaximoEspera":15,"salaId":1},{"diaSemana":2,"horaInicio":"08:00","horaFin":"13:00","tiempoMaximoEspera":15,"salaId":1},{"diaSemana":3,"horaInicio":"08:00","horaFin":"13:00","tiempoMaximoEspera":15,"salaId":1},{"diaSemana":4,"horaInicio":"08:00","horaFin":"13:00","tiempoMaximoEspera":15,"salaId":1},{"diaSemana":5,"horaInicio":"08:00","horaFin":"13:00","tiempoMaximoEspera":15,"salaId":1}]}'),
  ('dr_perez', 'doc123', 'Dr. Juan Pérez', 'MAT-1001', 1, FALSE, NULL, 'MASCULINO',
   '{"codEspecialidad":"CARDIO","sexo":"MASCULINO","agenda":[{"diaSemana":1,"horaInicio":"08:00","horaFin":"12:00","tiempoMaximoEspera":15,"salaId":2},{"diaSemana":3,"horaInicio":"08:00","horaFin":"12:00","tiempoMaximoEspera":15,"salaId":2}]}'),
  ('dra_gomez', 'doc123', 'Dra. Ana Gómez', 'MAT-1002', 1, FALSE, NULL, 'FEMENINO',
   '{"codEspecialidad":"PEDIATRIA","sexo":"FEMENINO","agenda":[{"diaSemana":2,"horaInicio":"09:00","horaFin":"13:00","tiempoMaximoEspera":15,"salaId":1},{"diaSemana":4,"horaInicio":"09:00","horaFin":"13:00","tiempoMaximoEspera":15,"salaId":1}]}')
ON CONFLICT (usuario) DO NOTHING;

-- Pacientes de Demo
INSERT INTO pacientes (usuario, contrasena, nombre_paciente, dni_paciente, edad, fecha_nacimiento, rol, es_provisoria) VALUES
  ('jperez', 'pac123', 'Juan Pérez', 35123456, 50, '1976-05-15', 'PACIENTE', FALSE),
  ('paciente', 'admin123', 'Paciente Prueba', 12345678, 30, '1995-01-01', 'PACIENTE', FALSE)
ON CONFLICT (usuario) DO NOTHING;
