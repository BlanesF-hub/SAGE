package com.sage.controller;

import com.sage.config.CustomUserDetails;
import com.sage.dto.request.ConfigurarDoctorRequest;
import com.sage.service.EmpleadoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/doctores")
public class DoctorController {

    private final EmpleadoService empleadoService;

    public DoctorController(EmpleadoService empleadoService) {
        this.empleadoService = empleadoService;
    }

    @PutMapping("/configurar")
    public ResponseEntity<String> configurarDoctor(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody ConfigurarDoctorRequest request
    ) {
        empleadoService.configurarDoctorCompleto(
                userDetails.getId(),
                request.getCodEspecialidad(),
                request.getEdadMinima(),
                request.getEdadMaxima(),
                request.getAgenda()
        );
        return ResponseEntity.ok("Doctor configurado exitosamente");
    }
}
