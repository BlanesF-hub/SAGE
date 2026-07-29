package com.sage.service;

import com.sage.model.*;
import com.sage.model.enums.EstadoTurno;
import com.sage.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ConsultaService {

    private final ConsultaRepository repository;
    private final TurnoRepository turnoRepository;
    private final PacienteRepository pacienteRepository;
    private final DoctorRepository doctorRepository;
    private final TipoTurnoRepository tipoTurnoRepository;
    private final EstadoConsultaRepository estadoConsultaRepository;
    private final ConsultaEstadoRepository consultaEstadoRepository;

    public ConsultaService(ConsultaRepository repository, TurnoRepository turnoRepository,
                           PacienteRepository pacienteRepository, DoctorRepository doctorRepository,
                           TipoTurnoRepository tipoTurnoRepository, EstadoConsultaRepository estadoConsultaRepository,
                           ConsultaEstadoRepository consultaEstadoRepository) {
        this.repository = repository;
        this.turnoRepository = turnoRepository;
        this.pacienteRepository = pacienteRepository;
        this.doctorRepository = doctorRepository;
        this.tipoTurnoRepository = tipoTurnoRepository;
        this.estadoConsultaRepository = estadoConsultaRepository;
        this.consultaEstadoRepository = consultaEstadoRepository;
    }

    @Transactional
    public Consulta ingresarUrgencia(Long pacienteId, Long doctorId, String descripcion) {
        Paciente paciente = pacienteRepository.findById(pacienteId)
                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado"));
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Doctor no encontrado"));

        TipoTurno tipoUrgencia = tipoTurnoRepository.findByCodTipoTurnoAndFechaHoraBajaIsNull("URGENCIA")
                .orElseThrow(() -> new IllegalStateException("Tipo de turno URGENCIA no configurado"));

        // Se crea un turno inmediato
        Turno turno = Turno.builder()
                .fechaHoraPlanificado(LocalDateTime.now())
                .descripcionTurno(descripcion)
                .estado(EstadoTurno.PRESENTE) // El paciente ya está físicamente ahí
                .confirmado(true)
                .tipoTurno(tipoUrgencia)
                .paciente(paciente)
                .doctor(doctor)
                .build();
        turno = turnoRepository.save(turno);

        // Se crea la Consulta
        Consulta consulta = Consulta.builder()
                .turno(turno)
                .fechaHoraInicioConsulta(LocalDateTime.now())
                .build();
        consulta = repository.save(consulta);

        // Historial Estado -> PENDIENTE (En espera de priorización del médico)
        EstadoConsulta estadoPendiente = estadoConsultaRepository.findByCodEcAndFechaHoraBajaIsNull("PENDIENTE")
                .orElseThrow(() -> new IllegalStateException("Estado PENDIENTE no configurado"));

        ConsultaEstado ce = ConsultaEstado.builder()
                .consulta(consulta)
                .estadoConsulta(estadoPendiente)
                .ordenCe(1)
                .fechaHoraInicio(LocalDateTime.now())
                .build();
        consultaEstadoRepository.save(ce);

        return consulta;
    }

    @Transactional
    public void priorizarUrgencia(Long consultaId, Integer prioridad) {
        Consulta consulta = repository.findById(consultaId)
                .orElseThrow(() -> new IllegalArgumentException("Consulta no encontrada"));
        Turno turno = consulta.getTurno();

        if (prioridad < 1 || prioridad > 3) {
            throw new IllegalArgumentException("La prioridad debe ser 1 (Sobreturno), 2 (Al final del día), o 3 (Rechazado)");
        }

        turno.setPrioridadUrgencia(prioridad);

        if (prioridad == 3) {
            // No es urgencia, no se atiende
            turno.setEstado(EstadoTurno.CANCELADO);
            turnoRepository.save(turno);

            // Transición a FINALIZADA (pero cancelada implícitamente)
            cambiarEstadoConsulta(consulta, "FINALIZADA");
        } else if (prioridad == 1) {
            // Sobreturno con prioridad máxima
            TipoTurno tipoSobreturno = tipoTurnoRepository.findByCodTipoTurnoAndFechaHoraBajaIsNull("SOBRETURNO")
                    .orElseThrow(() -> new IllegalStateException("Tipo de turno SOBRETURNO no configurado"));
            turno.setTipoTurno(tipoSobreturno);
            turnoRepository.save(turno);

            // Pasa a En Espera de atención
            cambiarEstadoConsulta(consulta, "EN_ESPERA");
        } else {
            // Prioridad 2 (Importante al final del día)
            turnoRepository.save(turno);
            cambiarEstadoConsulta(consulta, "EN_ESPERA");
        }
    }

    @Transactional
    public Consulta avanzarConsulta(Long consultaId, String diagnostico, String tratamiento, String observaciones) {
        Consulta consulta = repository.findById(consultaId)
                .orElseThrow(() -> new IllegalArgumentException("Consulta no encontrada"));

        List<ConsultaEstado> historial = consultaEstadoRepository.findByConsultaIdOrderByOrdenCeAsc(consultaId);
        if (historial.isEmpty()) {
            throw new IllegalStateException("La consulta no posee estados registrados");
        }

        ConsultaEstado estadoActual = historial.get(historial.size() - 1);
        String codActual = estadoActual.getEstadoConsulta().getCodEc();

        if ("PENDIENTE".equals(codActual)) {
            throw new IllegalStateException("La urgencia debe ser priorizada antes de iniciar la consulta");
        }

        if ("EN_ESPERA".equals(codActual)) {
            // Pasa a EN_CURSO
            cambiarEstadoConsulta(consulta, "EN_CURSO");
            consulta.getTurno().setEstado(EstadoTurno.EN_CONSULTA);
            turnoRepository.save(consulta.getTurno());
        } else if ("EN_CURSO".equals(codActual)) {
            // Finaliza la consulta
            consulta.setDiagnosticoConsulta(diagnostico);
            consulta.setTratamientoConsulta(tratamiento);
            consulta.setObservacionesConsulta(observaciones);
            consulta.setFechaHoraFinConsulta(LocalDateTime.now());
            repository.save(consulta);

            cambiarEstadoConsulta(consulta, "FINALIZADA");
            consulta.getTurno().setEstado(EstadoTurno.FINALIZADO);
            consulta.getTurno().setFechaHoraFin(LocalDateTime.now());
            turnoRepository.save(consulta.getTurno());
        } else {
            throw new IllegalStateException("La consulta ya ha finalizado");
        }

        return consulta;
    }

    private void cambiarEstadoConsulta(Consulta consulta, String codNuevoEstado) {
        List<ConsultaEstado> historial = consultaEstadoRepository.findByConsultaIdOrderByOrdenCeAsc(consulta.getId());
        if (!historial.isEmpty()) {
            ConsultaEstado actual = historial.get(historial.size() - 1);
            actual.setFechaFin(LocalDateTime.now());
            consultaEstadoRepository.save(actual);
        }

        EstadoConsulta nuevoEstado = estadoConsultaRepository.findByCodEcAndFechaHoraBajaIsNull(codNuevoEstado)
                .orElseThrow(() -> new IllegalArgumentException("El estado " + codNuevoEstado + " no existe o está inactivo"));

        ConsultaEstado nuevoCE = ConsultaEstado.builder()
                .consulta(consulta)
                .estadoConsulta(nuevoEstado)
                .ordenCe(historial.size() + 1)
                .fechaHoraInicio(LocalDateTime.now())
                .build();
        consultaEstadoRepository.save(nuevoCE);
    }
}
