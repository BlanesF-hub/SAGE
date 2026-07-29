-- ============================================================
-- SAGE v1 — Schema inicial
-- ============================================================

-- ── Geografía ─────────────────────────────────────────────

CREATE TABLE zona (
    id              BIGSERIAL       PRIMARY KEY,
    cod_zona        VARCHAR(20)     NOT NULL UNIQUE,
    nombre_zona     VARCHAR(100)    NOT NULL,
    fecha_desde     TIMESTAMP       NOT NULL DEFAULT NOW(),
    fecha_hasta     TIMESTAMP
);

CREATE TABLE localidad (
    id              BIGSERIAL       PRIMARY KEY,
    cod_localidad   VARCHAR(20)     NOT NULL UNIQUE,
    nombre_localidad VARCHAR(100)   NOT NULL,
    fecha_desde     TIMESTAMP       NOT NULL DEFAULT NOW(),
    fecha_hasta     TIMESTAMP,
    zona_id         BIGINT          NOT NULL REFERENCES zona(id)
);

-- ── Consultorio ───────────────────────────────────────────

CREATE TABLE consultorio (
    id                  BIGSERIAL       PRIMARY KEY,
    cod_consultorio     VARCHAR(20)     NOT NULL UNIQUE,
    nombre_consultorio  VARCHAR(150)    NOT NULL,
    direccion_consultorio VARCHAR(255),
    fecha_desde         TIMESTAMP       NOT NULL DEFAULT NOW(),
    fecha_hasta         TIMESTAMP,
    localidad_id        BIGINT          NOT NULL REFERENCES localidad(id)
);

-- ── Especialidad ──────────────────────────────────────────

CREATE TABLE especialidad (
    id                  BIGSERIAL       PRIMARY KEY,
    cod_especialidad    VARCHAR(20)     NOT NULL UNIQUE,
    nombre_especialidad VARCHAR(100)    NOT NULL,
    fecha_desde         TIMESTAMP       NOT NULL DEFAULT NOW(),
    fecha_hasta         TIMESTAMP
);

-- ── Obra Social ───────────────────────────────────────────

CREATE TABLE obra_social (
    id                  BIGSERIAL       PRIMARY KEY,
    cod_obra_social     VARCHAR(20)     NOT NULL UNIQUE,
    nombre_obra_social  VARCHAR(150)    NOT NULL,
    fecha_desde         TIMESTAMP       NOT NULL DEFAULT NOW(),
    fecha_hasta         TIMESTAMP
);

-- ── Tipo Turno ────────────────────────────────────────────

CREATE TABLE tipo_turno (
    id                  BIGSERIAL       PRIMARY KEY,
    cod_tipo_turno      VARCHAR(20)     NOT NULL UNIQUE,
    nombre_tipo_turno   VARCHAR(50)     NOT NULL,
    fecha_hora_baja     TIMESTAMP
);

-- ── Estado Consulta ───────────────────────────────────────

CREATE TABLE estado_consulta (
    id              BIGSERIAL       PRIMARY KEY,
    cod_ec          VARCHAR(20)     NOT NULL UNIQUE,
    nombre_ec       VARCHAR(50)     NOT NULL,
    fecha_hora_baja TIMESTAMP
);

-- ── Empleado (JOINED inheritance) ─────────────────────────

CREATE TABLE empleado (
    id                      BIGSERIAL       PRIMARY KEY,
    usuario                 VARCHAR(50)     NOT NULL UNIQUE,
    contrasena              VARCHAR(255)    NOT NULL,
    nombre_empleado         VARCHAR(150)    NOT NULL,
    nro_telefono            VARCHAR(20),
    fecha_desde_empleado    TIMESTAMP       NOT NULL DEFAULT NOW(),
    fecha_hasta_empleado    TIMESTAMP,
    rol                     VARCHAR(30)     NOT NULL,
    force_password_change   BOOLEAN         NOT NULL DEFAULT TRUE,
    consultorio_id          BIGINT          REFERENCES consultorio(id)
);

CREATE TABLE secretario (
    id              BIGINT          PRIMARY KEY REFERENCES empleado(id),
    cod_secretario  VARCHAR(20)     NOT NULL UNIQUE
);

CREATE TABLE doctor (
    id              BIGINT          PRIMARY KEY REFERENCES empleado(id),
    cod_doctor      VARCHAR(20)     NOT NULL UNIQUE,
    especialidad_id BIGINT          REFERENCES especialidad(id),
    edad_minima     INTEGER,
    edad_maxima     INTEGER         -- NULL = sin máximo
);

-- ── Agenda Doctor ─────────────────────────────────────────

CREATE TABLE agenda_doctor (
    id                      BIGSERIAL       PRIMARY KEY,
    doctor_id               BIGINT          NOT NULL REFERENCES doctor(id),
    dia_semana              INTEGER         NOT NULL,  -- 1=Lunes ... 7=Domingo
    hora_inicio             TIME            NOT NULL,
    hora_fin                TIME            NOT NULL,
    tiempo_maximo_espera    INTEGER         NOT NULL DEFAULT 15,  -- minutos
    activa                  BOOLEAN         NOT NULL DEFAULT TRUE,

    CONSTRAINT uk_agenda_doctor_dia UNIQUE (doctor_id, dia_semana)
);

-- ── Paciente (SINGLE_TABLE inheritance) ───────────────────

CREATE TABLE paciente (
    id                      BIGSERIAL       PRIMARY KEY,
    tipo_paciente           VARCHAR(30)     NOT NULL,  -- PARTICULAR, OBRA_SOCIAL, PAMI
    cod_paciente            VARCHAR(20)     NOT NULL UNIQUE,
    nombre_paciente         VARCHAR(150)    NOT NULL,
    usuario                 VARCHAR(50)     NOT NULL UNIQUE,
    contrasena              VARCHAR(255)    NOT NULL,
    dni_paciente            INTEGER         NOT NULL UNIQUE,
    nro_telefono_paciente   VARCHAR(20),
    fecha_nacimiento        DATE            NOT NULL,
    direccion_paciente      VARCHAR(255),
    fecha_hora_alta         TIMESTAMP       NOT NULL DEFAULT NOW(),
    fecha_hora_baja         TIMESTAMP,

    -- Campos PacienteObraSocial
    nro_afiliado            INTEGER,
    obra_social_id          BIGINT          REFERENCES obra_social(id),

    -- Campos PacientePami
    nro_beneficiario        INTEGER
);

-- ── Turno ─────────────────────────────────────────────────

CREATE TABLE turno (
    id                          BIGSERIAL       PRIMARY KEY,
    nro_turno                   SERIAL,
    fecha_hora_planificado      TIMESTAMP       NOT NULL,
    fecha_hora_inicio           TIMESTAMP,
    fecha_hora_fin              TIMESTAMP,
    descripcion_turno           TEXT,
    estado                      VARCHAR(30)     NOT NULL DEFAULT 'LIBRE',
    confirmado                  BOOLEAN         NOT NULL DEFAULT FALSE,
    recordatorio_enviado        BOOLEAN         NOT NULL DEFAULT FALSE,
    prioridad_urgencia          INTEGER,  -- 1, 2, 3 (solo para urgencias)

    tipo_turno_id               BIGINT          NOT NULL REFERENCES tipo_turno(id),
    paciente_id                 BIGINT          REFERENCES paciente(id),
    doctor_id                   BIGINT          NOT NULL REFERENCES doctor(id)
);

CREATE INDEX idx_turno_doctor_fecha ON turno(doctor_id, fecha_hora_planificado);
CREATE INDEX idx_turno_paciente ON turno(paciente_id);
CREATE INDEX idx_turno_estado ON turno(estado);

-- ── Consulta ──────────────────────────────────────────────

CREATE TABLE consulta (
    id                          BIGSERIAL       PRIMARY KEY,
    nro_consulta                SERIAL,
    turno_id                    BIGINT          NOT NULL UNIQUE REFERENCES turno(id),
    fecha_hora_inicio_consulta  TIMESTAMP,
    fecha_hora_fin_consulta     TIMESTAMP,
    diagnostico_consulta        TEXT,
    tratamiento_consulta        TEXT,
    observaciones_consulta      TEXT
);

-- ── Consulta Estado (historial de transiciones) ───────────

CREATE TABLE consulta_estado (
    id                  BIGSERIAL       PRIMARY KEY,
    consulta_id         BIGINT          NOT NULL REFERENCES consulta(id),
    estado_consulta_id  BIGINT          NOT NULL REFERENCES estado_consulta(id),
    orden_ce            INTEGER         NOT NULL,
    fecha_hora_inicio   TIMESTAMP       NOT NULL DEFAULT NOW(),
    fecha_fin           TIMESTAMP
);

CREATE INDEX idx_consulta_estado_consulta ON consulta_estado(consulta_id);

-- ── Datos iniciales ───────────────────────────────────────

-- Tipos de Turno
INSERT INTO tipo_turno (cod_tipo_turno, nombre_tipo_turno) VALUES
    ('NORMAL',     'Turno Normal'),
    ('SOBRETURNO', 'Sobreturno'),
    ('URGENCIA',   'Urgencia');

-- Estados de Consulta
INSERT INTO estado_consulta (cod_ec, nombre_ec) VALUES
    ('PENDIENTE',   'Pendiente'),
    ('EN_ESPERA',   'En Espera'),
    ('EN_CURSO',    'En Curso'),
    ('FINALIZADA',  'Finalizada');

-- Admin General (contraseña: admin123 - bcrypt hash)
INSERT INTO empleado (usuario, contrasena, nombre_empleado, rol, force_password_change)
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Administrador General', 'ADMIN_GENERAL', FALSE);
