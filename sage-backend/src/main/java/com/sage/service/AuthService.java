package com.sage.service;

import com.sage.config.CustomUserDetails;
import com.sage.config.JwtService;
import com.sage.dto.request.ChangePasswordRequest;
import com.sage.dto.request.LoginRequest;
import com.sage.dto.request.RegisterEmpleadoRequest;
import com.sage.dto.request.RegisterPacienteRequest;
import com.sage.dto.response.LoginResponse;
import com.sage.model.*;
import com.sage.model.enums.Rol;
import com.sage.repository.*;
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
    private final ConsultorioRepository consultorioRepository;
    private final EspecialidadRepository especialidadRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AuthenticationManager authenticationManager, JwtService jwtService,
                       EmpleadoRepository empleadoRepository, PacienteRepository pacienteRepository,
                       ObraSocialRepository obraSocialRepository, ConsultorioRepository consultorioRepository,
                       EspecialidadRepository especialidadRepository, PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.empleadoRepository = empleadoRepository;
        this.pacienteRepository = pacienteRepository;
        this.obraSocialRepository = obraSocialRepository;
        this.consultorioRepository = consultorioRepository;
        this.especialidadRepository = especialidadRepository;
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
                ((CustomUserDetails) userDetails).getNombre(),
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
    public void registerEmpleado(RegisterEmpleadoRequest request) {
        if (empleadoRepository.findByUsuarioAndFechaHastaEmpleadoIsNull(request.getUsuario()).isPresent() ||
            pacienteRepository.findByUsuarioAndFechaHoraBajaIsNull(request.getUsuario()).isPresent()) {
            throw new IllegalArgumentException("El nombre de usuario ya existe");
        }

        Rol rol = Rol.valueOf(request.getRol().toUpperCase());
        Consultorio consultorio = consultorioRepository.findAll().stream().findFirst().orElse(null);

        switch (rol) {
            case SECRETARIO -> {
                Secretario sec = new Secretario();
                sec.setUsuario(request.getUsuario());
                sec.setContrasena(passwordEncoder.encode(request.getContrasena()));
                sec.setNombreEmpleado(request.getNombreEmpleado());
                sec.setNroTelefono(request.getNroTelefono());
                sec.setRol(Rol.SECRETARIO);
                sec.setConsultorio(consultorio);
                sec.setForcePasswordChange(false);
                sec.setCodSecretario("SEC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                empleadoRepository.save(sec);
            }
            case DOCTOR -> {
                Doctor doc = new Doctor();
                doc.setUsuario(request.getUsuario());
                doc.setContrasena(passwordEncoder.encode(request.getContrasena()));
                doc.setNombreEmpleado(request.getNombreEmpleado());
                doc.setNroTelefono(request.getNroTelefono());
                doc.setRol(Rol.DOCTOR);
                doc.setConsultorio(consultorio);
                doc.setForcePasswordChange(false);
                doc.setCodDoctor("DOC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                if (request.getCodEspecialidad() != null && !request.getCodEspecialidad().isBlank()) {
                    especialidadRepository.findByCodEspecialidadAndFechaHastaIsNull(request.getCodEspecialidad())
                            .ifPresent(doc::setEspecialidad);
                }
                empleadoRepository.save(doc);
            }
            case ADMIN_CONSULTORIO, ADMIN_GENERAL -> {
                Empleado emp = new Empleado();
                emp.setUsuario(request.getUsuario());
                emp.setContrasena(passwordEncoder.encode(request.getContrasena()));
                emp.setNombreEmpleado(request.getNombreEmpleado());
                emp.setNroTelefono(request.getNroTelefono());
                emp.setRol(rol);
                emp.setConsultorio(consultorio);
                emp.setForcePasswordChange(false);
                empleadoRepository.save(emp);
            }
            default -> throw new IllegalArgumentException("Rol no válido para registro");
        }
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
