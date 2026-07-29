package com.sage.repository;

import com.sage.model.Turno;
import com.sage.model.enums.EstadoTurno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TurnoRepository extends JpaRepository<Turno, Long> {
    
    List<Turno> findByDoctorIdAndFechaHoraPlanificadoBetween(Long doctorId, LocalDateTime start, LocalDateTime end);
    
    List<Turno> findByPacienteIdAndEstadoNot(Long pacienteId, EstadoTurno estado);
    
    List<Turno> findByEstadoAndFechaHoraPlanificadoBetween(EstadoTurno estado, LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT t FROM Turno t WHERE t.doctor.id = :doctorId " +
           "AND t.fechaHoraPlanificado = :fechaHora " +
           "AND t.estado != 'CANCELADO'")
    List<Turno> findActiveTurnosAtSlot(@Param("doctorId") Long doctorId, @Param("fechaHora") LocalDateTime fechaHora);
}
