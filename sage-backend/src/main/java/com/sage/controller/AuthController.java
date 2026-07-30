package com.sage.controller;

import com.sage.dto.request.ChangePasswordRequest;
import com.sage.dto.request.LoginRequest;
import com.sage.dto.request.RegisterEmpleadoRequest;
import com.sage.dto.request.RegisterPacienteRequest;
import com.sage.dto.response.LoginResponse;
import com.sage.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register-paciente")
    public ResponseEntity<String> registerPaciente(@Valid @RequestBody RegisterPacienteRequest request) {
        authService.registerPaciente(request);
        return ResponseEntity.ok("Paciente registrado exitosamente");
    }

    @PostMapping("/register-empleado")
    public ResponseEntity<String> registerEmpleado(@Valid @RequestBody RegisterEmpleadoRequest request) {
        authService.registerEmpleado(request);
        return ResponseEntity.ok("Actor / Empleado registrado exitosamente");
    }

    @PutMapping("/change-password")
    public ResponseEntity<String> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        authService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok("Contraseña cambiada exitosamente");
    }
}
