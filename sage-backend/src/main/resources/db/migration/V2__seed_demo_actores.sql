-- ============================================================
-- SAGE v2 — Seed de Actores y Datos Iniciales de Prueba
-- ============================================================

-- 1. Zona y Localidad inicial
INSERT INTO zona (cod_zona, nombre_zona)
VALUES ('ZONA-CENTRO', 'Zona Centro')
ON CONFLICT (cod_zona) DO NOTHING;

INSERT INTO localidad (cod_localidad, nombre_localidad, zona_id)
SELECT 'LOC-CDB', 'Córdoba Capital', z.id FROM zona z WHERE z.cod_zona = 'ZONA-CENTRO'
ON CONFLICT (cod_localidad) DO NOTHING;

-- 2. Consultorio Central
INSERT INTO consultorio (cod_consultorio, nombre_consultorio, direccion_consultorio, localidad_id)
SELECT 'CONS-CENTRAL', 'Consultorio Central SAGE', 'Av. Colón 1234', l.id FROM localidad l WHERE l.cod_localidad = 'LOC-CDB'
ON CONFLICT (cod_consultorio) DO NOTHING;

-- 3. Especialidades
INSERT INTO especialidad (cod_especialidad, nombre_especialidad)
VALUES 
    ('CLINICA', 'Clínica General'),
    ('CARDIO', 'Cardiología'),
    ('PEDIATRIA', 'Pediatría')
ON CONFLICT (cod_especialidad) DO NOTHING;

-- 4. Obras Sociales
INSERT INTO obra_social (cod_obra_social, nombre_obra_social)
VALUES 
    ('OSDE', 'OSDE 210'),
    ('SWISS', 'Swiss Medical'),
    ('PAMI_OS', 'PAMI Instituto')
ON CONFLICT (cod_obra_social) DO NOTHING;

-- 4.1 Admin General (usuario: admin / contrasena: admin123)
INSERT INTO empleado (usuario, contrasena, nombre_empleado, rol, force_password_change, consultorio_id)
SELECT 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Administrador General SAGE', 'ADMIN_GENERAL', FALSE, c.id 
FROM consultorio c WHERE c.cod_consultorio = 'CONS-CENTRAL'
ON CONFLICT (usuario) DO NOTHING;

-- 5. Admin Consultorio (usuario: admin_consultorio / contrasena: admin123)
INSERT INTO empleado (usuario, contrasena, nombre_empleado, rol, force_password_change, consultorio_id)
SELECT 'admin_consultorio', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin Consultorio Central', 'ADMIN_CONSULTORIO', FALSE, c.id 
FROM consultorio c WHERE c.cod_consultorio = 'CONS-CENTRAL'
ON CONFLICT (usuario) DO NOTHING;

-- 6. Secretario (usuario: secretario / contrasena: admin123)
INSERT INTO empleado (usuario, contrasena, nombre_empleado, rol, force_password_change, consultorio_id)
SELECT 'secretario', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Secretario Recepción', 'SECRETARIO', FALSE, c.id 
FROM consultorio c WHERE c.cod_consultorio = 'CONS-CENTRAL'
ON CONFLICT (usuario) DO NOTHING;

INSERT INTO secretario (id, cod_secretario)
SELECT e.id, 'SEC-001' FROM empleado e WHERE e.usuario = 'secretario'
ON CONFLICT (cod_secretario) DO NOTHING;

-- 7. Doctor (usuario: doctor / contrasena: admin123)
INSERT INTO empleado (usuario, contrasena, nombre_empleado, rol, force_password_change, consultorio_id)
SELECT 'doctor', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Dr. Carlos Pérez', 'DOCTOR', FALSE, c.id 
FROM consultorio c WHERE c.cod_consultorio = 'CONS-CENTRAL'
ON CONFLICT (usuario) DO NOTHING;

INSERT INTO doctor (id, cod_doctor, especialidad_id, edad_minima, edad_maxima)
SELECT e.id, 'DOC-001', esp.id, 0, 99
FROM empleado e
CROSS JOIN especialidad esp
WHERE e.usuario = 'doctor' AND esp.cod_especialidad = 'CLINICA'
ON CONFLICT (cod_doctor) DO NOTHING;

-- 8. Paciente Demo (usuario: paciente / contrasena: admin123)
INSERT INTO paciente (tipo_paciente, cod_paciente, nombre_paciente, usuario, contrasena, dni_paciente, nro_telefono_paciente, fecha_nacimiento, direccion_paciente)
VALUES ('PARTICULAR', 'PAC-DEMO1', 'Juan Paciente Ejemplo', 'paciente', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 35123456, '351-5551234', '1990-05-15', 'Calle Falsa 123')
ON CONFLICT (usuario) DO NOTHING;
