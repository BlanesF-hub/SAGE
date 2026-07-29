package com.sage.service;

import com.sage.model.AgendaDoctor;
import com.sage.model.Turno;
import com.sage.repository.AgendaDoctorRepository;
import com.sage.repository.TurnoRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class AgendaService {

    private final AgendaDoctorRepository agendaDoctorRepository;
    private final TurnoRepository turnoRepository;

    public AgendaService(AgendaDoctorRepository agendaDoctorRepository, TurnoRepository turnoRepository) {
        this.agendaDoctorRepository = agendaDoctorRepository;
        this.turnoRepository = turnoRepository;
    }

    /**
     * Devuelve una lista de los horarios (slots) planificables de 30 minutos
     * para un doctor en una fecha determinada.
     */
    public List<LocalTime> obtenerSlotsDisponibles(Long doctorId, LocalDate fecha) {
        List<LocalTime> slots = new ArrayList<>();
        
        // Obtener el día de la semana (1=Lunes, ..., 7=Domingo)
        int diaSemana = fecha.getDayOfWeek().getValue();
        
        // Buscar si el doctor atiende ese día
        var agendaOpt = agendaDoctorRepository.findByDoctorIdAndDiaSemanaAndActivaTrue(doctorId, diaSemana);
        if (agendaOpt.isEmpty()) {
            return slots; // No atiende este día
        }
        
        AgendaDoctor agenda = agendaOpt.get();
        LocalTime inicio = agenda.getHoraInicio();
        LocalTime fin = agenda.getHoraFin();

        // Buscar todos los turnos existentes del doctor para esa fecha
        LocalDateTime startOfDay = fecha.atStartOfDay();
        LocalDateTime endOfDay = fecha.atTime(LocalTime.MAX);
        List<Turno> turnosExistentes = turnoRepository.findByDoctorIdAndFechaHoraPlanificadoBetween(doctorId, startOfDay, endOfDay);

        LocalTime current = inicio;
        while (current.isBefore(fin)) {
            final LocalTime slotTime = current;
            
            // Verificar si hay un turno activo agendado en este slot
            boolean ocupado = turnosExistentes.stream().anyMatch(t -> 
                t.getFechaHoraPlanificado().toLocalTime().equals(slotTime) && 
                !t.getEstado().name().equals("CANCELADO") &&
                !t.getEstado().name().equals("LIBRE")
            );

            if (!ocupado) {
                slots.add(slotTime);
            }
            current = current.plusMinutes(30); // distancia horaria de 30 minutos
        }

        return slots;
    }

    public void guardarAgenda(AgendaDoctor agenda) {
        agendaDoctorRepository.save(agenda);
    }
}
