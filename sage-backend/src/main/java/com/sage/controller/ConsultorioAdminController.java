package com.sage.controller;

import com.sage.config.CustomUserDetails;
import com.sage.model.Doctor;
import com.sage.model.Secretario;
import com.sage.service.EmpleadoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/consultorio")
public class ConsultorioAdminController {

    private final EmpleadoService empleadoService;

    public ConsultorioAdminController(EmpleadoService empleadoService) {
        this.empleadoService = empleadoService;
    }

    @PostMapping("/personal/secretario")
    public ResponseEntity<Secretario> registrarSecretario(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam String usuario,
            @RequestParam String contrasenaProvisional,
            @RequestParam String nombre,
            @RequestParam(required = false) String nroTelefono
    ) {
        Long consultorioId = userDetails.getConsultorioId();
        if (consultorioId == null) {
            throw new IllegalStateException("El administrador no está asignado a ningún consultorio");
        }
        Secretario sec = empleadoService.registrarSecretario(usuario, contrasenaProvisional, nombre, nroTelefono, consultorioId);
        return ResponseEntity.ok(sec);
    }

    @PostMapping("/personal/doctor")
    public ResponseEntity<Doctor> registrarDoctor(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam String usuario,
            @RequestParam String contrasenaProvisional,
            @RequestParam String nombre,
            @RequestParam(required = false) String nroTelefono
    ) {
        Long consultorioId = userDetails.getConsultorioId();
        if (consultorioId == null) {
            throw new IllegalStateException("El administrador no está asignado a ningún consultorio");
        }
        Doctor doc = empleadoService.registrarDoctor(usuario, contrasenaProvisional, nombre, nroTelefono, consultorioId);
        return ResponseEntity.ok(doc);
    }
}
