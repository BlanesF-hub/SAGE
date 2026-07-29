package com.sage.service;

import com.sage.model.*;
import com.sage.model.enums.EstadoTurno;
import com.sage.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class TurnoService {

    private final TurnoRepository repository;
    private final PacienteRepository pacienteRepository;
    private final DoctorRepository doctorRepository;
    private final TipoTurnoRepository tipoTurnoRepository;
    private final AgendaDoctorRepository agendaDoctorRepository;
    private final NotificationService notificationService;

    // Dependencias para marcar presente (iniciar Consulta)
    private final ConsultaRepository consultaRepository;
    private final EstadoConsultaRepository estadoConsultaRepository;
    private final ConsultaEstadoRepository consultaEstadoRepository;

    public TurnoService(TurnoRepository repository, PacienteRepository pacienteRepository,
                        DoctorRepository doctorRepository, TipoTurnoRepository tipoTurnoRepository,
                        AgendaDoctorRepository agendaDoctorRepository, NotificationService notificationService,
                        ConsultaRepository consultaRepository, EstadoConsultaRepository estadoConsultaRepository,
                        ConsultaEstadoRepository consultaEstadoRepository) {
        this.repository = repository;
        this.pacienteRepository = pacienteRepository;
        this.doctorRepository = doctorRepository;
        this.tipoTurnoRepository = tipoTurnoRepository;
        this.agendaDoctorRepository = agendaDoctorRepository;
        this.notificationService = notificationService;
        this.consultaRepository = consultaRepository;
        this.estadoConsultaRepository = estadoConsultaRepository;
        this.consultaEstadoRepository = consultaEstadoRepository;
    }

    @Transactional
    public Turno solicitarTurno(Long pacienteId, Long doctorId, LocalDateTime fechaHora, String descripcion) {
        Paciente paciente = pacienteRepository.findById(pacienteId)
                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado"));
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Doctor no encontrado"));

        // 1. Comprobación de edad
        int edad = paciente.getEdad();
        if (doctor.getEdadMinima() != null && edad < doctor.getEdadMinima()) {
            throw new IllegalArgumentException("El paciente no cumple con la edad mínima requerida por el doctor (" + doctor.getEdadMinima() + " años)");
        }
        if (doctor.getEdadMaxima() != null && edad > doctor.getEdadMaxima()) {
            throw new IllegalArgumentException("El paciente supera la edad máxima permitida por el doctor (" + doctor.getEdadMaxima() + " años)");
        }

        // 2. Comprobar disponibilidad de agenda
        int diaSemana = fechaHora.getDayOfWeek().getValue();
        AgendaDoctor agenda = agendaDoctorRepository.findByDoctorIdAndDiaSemanaAndActivaTrue(doctorId, diaSemana)
                .orElseThrow(() -> new IllegalArgumentException("El doctor no atiende en el día solicitado"));

        LocalTime hora = fechaHora.toLocalTime();
        if (hora.isBefore(agenda.getHoraInicio()) || hora.isAfter(agenda.getHoraFin().minusMinutes(30))) {
            throw new IllegalArgumentException("La hora del turno está fuera del rango de atención del doctor");
        }

        // 3. Comprobar si el slot está libre
        List<Turno> conflictos = repository.findActiveTurnosAtSlot(doctorId, fechaHora);
        if (!conflictos.isEmpty()) {
            throw new IllegalArgumentException("El slot de horario ya se encuentra ocupado");
        }

        TipoTurno tipoNormal = tipoTurnoRepository.findByCodTipoTurnoAndFechaHoraBajaIsNull("NORMAL")
                .orElseThrow(() -> new IllegalStateException("Tipo de turno NORMAL no configurado"));

        Turno turno = Turno.builder()
                .fechaHoraPlanificado(fechaHora)
                .descripcionTurno(descripcion)
                .estado(EstadoTurno.ASIGNADO)
                .confirmado(false)
                .tipoTurno(tipoNormal)
                .paciente(paciente)
                .doctor(doctor)
                .build();

        turno = repository.save(turno);

        // Comunicar por WhatsApp
        notificationService.enviarAsignacionTurno(turno);

        return turno;
    }

    @Transactional
    public Turno reasignarTurno(Long turnoId, LocalDateTime nuevaFechaHora) {
        Turno turno = repository.findById(turnoId)
                .orElseThrow(() -> new IllegalArgumentException("Turno no encontrado"));

        // Comprobar disponibilidad
        int diaSemana = nuevaFechaHora.getDayOfWeek().getValue();
        AgendaDoctor agenda = agendaDoctorRepository.findByDoctorIdAndDiaSemanaAndActivaTrue(turno.getDoctor().getId(), diaSemana)
                .orElseThrow(() -> new IllegalArgumentException("El doctor no atiende en el día solicitado"));

        LocalTime hora = nuevaFechaHora.toLocalTime();
        if (hora.isBefore(agenda.getHoraInicio()) || hora.isAfter(agenda.getHoraFin().minusMinutes(30))) {
            throw new IllegalArgumentException("La hora está fuera del rango de atención");
        }

        List<Turno> conflictos = repository.findActiveTurnosAtSlot(turno.getDoctor().getId(), nuevaFechaHora);
        if (!conflictos.isEmpty()) {
            throw new IllegalArgumentException("El nuevo slot de horario ya se encuentra ocupado");
        }

        turno.setFechaHoraPlanificado(nuevaFechaHora);
        turno.setEstado(EstadoTurno.REASIGNADO);
        turno.setConfirmado(false); // Requiere re-confirmar

        turno = repository.save(turno);

        // Comunicar por WhatsApp
        notificationService.enviarReasignacionTurno(turno);

        return turno;
    }

    @Transactional
    public void confirmarTurno(Long turnoId) {
        Turno turno = repository.findById(turnoId)
                .orElseThrow(() -> new IllegalArgumentException("Turno no encontrado"));
        if (turno.getEstado() != EstadoTurno.ASIGNADO && turno.getEstado() != EstadoTurno.REASIGNADO) {
            throw new IllegalArgumentException("El turno no está en un estado que requiera confirmación");
        }
        turno.setEstado(EstadoTurno.CONFIRMADO);
        turno.setConfirmado(true);
        repository.save(turno);
    }

    @Transactional
    public Consulta marcarPresente(Long turnoId) {
        Turno turno = repository.findById(turnoId)
                .orElseThrow(() -> new IllegalArgumentException("Turno no encontrado"));

        if (turno.getEstado() != EstadoTurno.CONFIRMADO) {
            throw new IllegalArgumentException("El turno debe estar CONFIRMADO para marcar presencia");
        }

        // 1. Modificar turno
        turno.setEstado(EstadoTurno.PRESENTE);
        turno.setFechaHoraInicio(LocalDateTime.now());
        repository.save(turno);

        // 2. Crear Consulta
        Consulta consulta = Consulta.builder()
                .turno(turno)
                .fechaHoraInicioConsulta(LocalDateTime.now())
                .build();
        consulta = consultaRepository.save(consulta);

        // 3. Crear Historial Estado Consulta -> EN_ESPERA (como solicita el enunciado)
        EstadoConsulta estadoEnEspera = estadoConsultaRepository.findByCodEcAndFechaHoraBajaIsNull("EN_ESPERA")
                .orElseThrow(() -> new IllegalStateException("Estado EN_ESPERA no configurado"));

        ConsultaEstado ce = ConsultaEstado.builder()
                .consulta(consulta)
                .estadoConsulta(estadoEnEspera)
                .ordenCe(1)
                .fechaHoraInicio(LocalDateTime.now())
                .build();
        consultaEstadoRepository.save(ce);

        consulta.getEstados().add(ce);
        return consulta;
    }
}
