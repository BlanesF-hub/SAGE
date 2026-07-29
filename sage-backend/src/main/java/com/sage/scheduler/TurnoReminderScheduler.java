package com.sage.scheduler;

import com.sage.model.Turno;
import com.sage.model.enums.EstadoTurno;
import com.sage.repository.TurnoRepository;
import com.sage.service.NotificationService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class TurnoReminderScheduler {

    private final TurnoRepository turnoRepository;
    private final NotificationService notificationService;

    public TurnoReminderScheduler(TurnoRepository turnoRepository, NotificationService notificationService) {
        this.turnoRepository = turnoRepository;
        this.notificationService = notificationService;
    }

    /**
     * Envía recordatorios 24 horas antes del turno.
     * Se ejecuta cada hora.
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void enviarRecordatorios24Horas() {
        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime inicioRango = ahora.plusHours(23);
        LocalDateTime finRango = ahora.plusHours(25);

        // Buscar turnos en la ventana de 23 a 25 horas que estén ASIGNADOS o REASIGNADOS
        // y que no tengan el recordatorio enviado.
        List<Turno> turnosParaRecordar = turnoRepository.findByEstadoAndFechaHoraPlanificadoBetween(
                EstadoTurno.ASIGNADO, inicioRango, finRango
        );

        for (Turno turno : turnosParaRecordar) {
            if (!turno.isRecordatorioEnviado() && turno.getPaciente() != null) {
                notificationService.enviarRecordatorioTurno(turno);
                turno.setRecordatorioEnviado(true);
                turnoRepository.save(turno);
            }
        }
    }

    /**
     * Libera los turnos que no fueron confirmados a tiempo.
     * Si faltan menos de 12 horas para el turno y sigue sin confirmarse, pasa a LIBRE.
     * Se ejecuta cada hora.
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void liberarTurnosNoConfirmados() {
        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime limiteLiberacion = ahora.plusHours(12);

        // Buscar todos los turnos ASIGNADOS que estén dentro de las próximas 12 horas
        List<Turno> turnosProximos = turnoRepository.findByEstadoAndFechaHoraPlanificadoBetween(
                EstadoTurno.ASIGNADO, ahora, limiteLiberacion
        );

        for (Turno turno : turnosProximos) {
            if (!turno.isConfirmado()) {
                System.out.println("[SCHEDULER] Liberando turno nro: " + turno.getNroTurno() + " por falta de confirmación.");
                turno.setEstado(EstadoTurno.LIBRE);
                turno.setPaciente(null); // Queda libre para otros pacientes
                turno.setConfirmado(false);
                turno.setRecordatorioEnviado(false);
                turnoRepository.save(turno);
            }
        }
    }
}
