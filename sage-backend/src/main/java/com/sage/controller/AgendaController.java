package com.sage.controller;

import com.sage.service.AgendaService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/agenda")
public class AgendaController {

    private final AgendaService agendaService;

    public AgendaController(AgendaService agendaService) {
        this.agendaService = agendaService;
    }

    @GetMapping("/{doctorId}/slots")
    public ResponseEntity<List<LocalTime>> obtenerSlotsDisponibles(
            @PathVariable Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha
    ) {
        List<LocalTime> slots = agendaService.obtenerSlotsDisponibles(doctorId, fecha);
        return ResponseEntity.ok(slots);
    }
}
