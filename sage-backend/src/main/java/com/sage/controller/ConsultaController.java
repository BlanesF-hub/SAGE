package com.sage.controller;

import com.sage.model.Consulta;
import com.sage.service.ConsultaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/consultas")
public class ConsultaController {

    private final ConsultaService consultaService;

    public ConsultaController(ConsultaService consultaService) {
        this.consultaService = consultaService;
    }

    @PostMapping("/urgencias")
    public ResponseEntity<Consulta> ingresarUrgencia(
            @RequestParam Long pacienteId,
            @RequestParam Long doctorId,
            @RequestParam String descripcion
    ) {
        Consulta consulta = consultaService.ingresarUrgencia(pacienteId, doctorId, descripcion);
        return ResponseEntity.ok(consulta);
    }

    @PutMapping("/urgencias/{id}/priorizar")
    public ResponseEntity<String> priorizarUrgencia(
            @PathVariable Long id,
            @RequestParam Integer prioridad
    ) {
        consultaService.priorizarUrgencia(id, prioridad);
        return ResponseEntity.ok("Urgencia priorizada con éxito");
    }

    @PutMapping("/{id}/avanzar")
    public ResponseEntity<Consulta> avanzarConsulta(
            @PathVariable Long id,
            @RequestParam(required = false) String diagnostico,
            @RequestParam(required = false) String tratamiento,
            @RequestParam(required = false) String observaciones
    ) {
        Consulta consulta = consultaService.avanzarConsulta(id, diagnostico, tratamiento, observaciones);
        return ResponseEntity.ok(consulta);
    }
}
