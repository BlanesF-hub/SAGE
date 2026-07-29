package com.sage.service;

import com.sage.config.CustomUserDetails;
import com.sage.config.JwtService;
import com.sage.dto.request.ChangePasswordRequest;
import com.sage.dto.request.LoginRequest;
import com.sage.dto.request.RegisterPacienteRequest;
import com.sage.dto.response.LoginResponse;
import com.sage.model.*;
import com.sage.repository.EmpleadoRepository;
import com.sage.repository.ObraSocialRepository;
import com.sage.repository.PacienteRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final EmpleadoRepository empleadoRepository;
    private final PacienteRepository pacienteRepository;
    private final ObraSocialRepository obraSocialRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AuthenticationManager authenticationManager, JwtService jwtService,
                       EmpleadoRepository empleadoRepository, PacienteRepository pacienteRepository,
                       ObraSocialRepository obraSocialRepository, PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.empleadoRepository = empleadoRepository;
        this.pacienteRepository = pacienteRepository;
        this.obraSocialRepository = obraSocialRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsuario(), request.getContrasena())
        );

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String token = jwtService.generateToken(userDetails);

        return new LoginResponse(
                token,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getUsername(), // O nombre completo si tuviéramos cargado el objeto
                userDetails.getRol().name(),
                userDetails.getConsultorioId(),
                userDetails.isForcePasswordChange()
        );
    }

    @Transactional
    public void registerPaciente(RegisterPacienteRequest request) {
        if (pacienteRepository.findByUsuarioAndFechaHoraBajaIsNull(request.getUsuario()).isPresent() ||
            empleadoRepository.findByUsuarioAndFechaHastaEmpleadoIsNull(request.getUsuario()).isPresent()) {
            throw new IllegalArgumentException("El nombre de usuario ya existe");
        }

        if (pacienteRepository.findByDniPacienteAndFechaHoraBajaIsNull(request.getDniPaciente()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un paciente registrado con el DNI ingresado");
        }

        Paciente paciente;
        String tipo = request.getTipoPaciente().toUpperCase();
        String codPaciente = "PAC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        switch (tipo) {
            case "OBRA_SOCIAL" -> {
                PacienteObraSocial pos = new PacienteObraSocial();
                pos.setNroAfiliado(request.getNroAfiliado());
                ObraSocial os = obraSocialRepository.findByCodObraSocialAndFechaHastaIsNull(request.getCodObraSocial())
                        .orElseThrow(() -> new IllegalArgumentException("La Obra Social especificada no existe o no está activa"));
                pos.setObraSocial(os);
                paciente = pos;
            }
            case "PAMI" -> {
                PacientePami pp = new PacientePami();
                pp.setNroBeneficiario(request.getNroBeneficiario());
                paciente = pp;
            }
            case "PARTICULAR" -> paciente = new PacienteParticular();
            default -> throw new IllegalArgumentException("Tipo de paciente inválido: " + request.getTipoPaciente());
        }

        paciente.setCodPaciente(codPaciente);
        paciente.setNombrePaciente(request.getNombrePaciente());
        paciente.setUsuario(request.getUsuario());
        paciente.setContrasena(passwordEncoder.encode(request.getContrasena()));
        paciente.setDniPaciente(request.getDniPaciente());
        paciente.setNroTelefonoPaciente(request.getNroTelefonoPaciente());
        paciente.setFechaNacimiento(request.getFechaNacimiento());
        paciente.setDireccionPaciente(request.getDireccionPaciente());

        pacienteRepository.save(paciente);
    }

    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        Empleado empleado = empleadoRepository.findByUsuarioAndFechaHastaEmpleadoIsNull(username)
                .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado o inactivo"));

        if (!passwordEncoder.matches(request.getContrasenaActual(), empleado.getContrasena())) {
            throw new IllegalArgumentException("La contraseña actual es incorrecta");
        }

        empleado.setContrasena(passwordEncoder.encode(request.getContrasenaNueva()));
        empleado.setForcePasswordChange(false);
        empleadoRepository.save(empleado);
    }
}
