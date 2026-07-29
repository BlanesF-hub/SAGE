package com.sage.controller;

import com.sage.dto.request.SolicitudTurnoRequest;
import com.sage.model.Consulta;
import com.sage.model.Turno;
import com.sage.service.TurnoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/turnos")
public class TurnoController {

    private final TurnoService turnoService;

    public TurnoController(TurnoService turnoService) {
        this.turnoService = turnoService;
    }

    @PostMapping
    public ResponseEntity<Turno> solicitarTurno(@Valid @RequestBody SolicitudTurnoRequest request) {
        Turno turno = turnoService.solicitarTurno(
                request.getPacienteId(),
                request.getDoctorId(),
                request.getFechaHora(),
                request.getDescripcion()
        );
        return ResponseEntity.ok(turno);
    }

    @PutMapping("/{id}/reasignar")
    public ResponseEntity<Turno> reasignarTurno(
            @PathVariable Long id,
            @RequestParam LocalDateTime nuevaFechaHora
    ) {
        Turno turno = turnoService.reasignarTurno(id, nuevaFechaHora);
        return ResponseEntity.ok(turno);
    }

    @PutMapping("/{id}/confirmar")
    public ResponseEntity<String> confirmarTurno(@PathVariable Long id) {
        turnoService.confirmarTurno(id);
        return ResponseEntity.ok("Turno confirmado exitosamente");
    }

    @PutMapping("/{id}/presente")
    public ResponseEntity<Consulta> marcarPresente(@PathVariable Long id) {
        Consulta consulta = turnoService.marcarPresente(id);
        return ResponseEntity.ok(consulta);
    }
}
