package com.sage.service;

import com.sage.model.Consultorio;
import com.sage.model.Doctor;
import com.sage.model.Especialidad;
import com.sage.model.Secretario;
import com.sage.model.enums.Rol;
import com.sage.repository.ConsultorioRepository;
import com.sage.repository.DoctorRepository;
import com.sage.repository.EmpleadoRepository;
import com.sage.repository.EspecialidadRepository;
import com.sage.repository.SecretarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.sage.model.AgendaDoctor;
import com.sage.dto.request.ConfigurarDoctorRequest;
import java.util.List;
import java.util.UUID;

@Service
public class EmpleadoService {

    private final EmpleadoRepository empleadoRepository;
    private final SecretarioRepository secretarioRepository;
    private final DoctorRepository doctorRepository;
    private final ConsultorioRepository consultorioRepository;
    private final EspecialidadRepository especialidadRepository;
    private final PasswordEncoder passwordEncoder;

    public EmpleadoService(EmpleadoRepository empleadoRepository, SecretarioRepository secretarioRepository,
                           DoctorRepository doctorRepository, ConsultorioRepository consultorioRepository,
                           EspecialidadRepository especialidadRepository, PasswordEncoder passwordEncoder) {
        this.empleadoRepository = empleadoRepository;
        this.secretarioRepository = secretarioRepository;
        this.doctorRepository = doctorRepository;
        this.consultorioRepository = consultorioRepository;
        this.especialidadRepository = especialidadRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Secretario registrarSecretario(String usuario, String contrasenaProvisional, String nombre, 
                                          String nroTelefono, Long consultorioId) {
        validarUsuario(usuario);
        
        Consultorio consultorio = consultorioRepository.findById(consultorioId)
                .orElseThrow(() -> new IllegalArgumentException("El consultorio no existe"));

        Secretario secretario = new Secretario();
        secretario.setUsuario(usuario);
        secretario.setContrasena(passwordEncoder.encode(contrasenaProvisional));
        secretario.setNombreEmpleado(nombre);
        secretario.setNroTelefono(nroTelefono);
        secretario.setRol(Rol.SECRETARIO);
        secretario.setConsultorio(consultorio);
        secretario.setForcePasswordChange(true);
        
        String codSecretario = "SEC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        secretario.setCodSecretario(codSecretario);

        return secretarioRepository.save(secretario);
    }

    @Transactional
    public Doctor registrarDoctor(String usuario, String contrasenaProvisional, String nombre, 
                                      String nroTelefono, Long consultorioId) {
        validarUsuario(usuario);
        
        Consultorio consultorio = consultorioRepository.findById(consultorioId)
                .orElseThrow(() -> new IllegalArgumentException("El consultorio no existe"));

        Doctor doctor = new Doctor();
        doctor.setUsuario(usuario);
        doctor.setContrasena(passwordEncoder.encode(contrasenaProvisional));
        doctor.setNombreEmpleado(nombre);
        doctor.setNroTelefono(nroTelefono);
        doctor.setRol(Rol.DOCTOR);
        doctor.setConsultorio(consultorio);
        doctor.setForcePasswordChange(true);
        
        String codDoctor = "DOC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        doctor.setCodDoctor(codDoctor);

        return doctorRepository.save(doctor);
    }

    @Transactional
    public void configurarDoctorCompleto(Long doctorId, String codEspecialidad, 
                                         Integer edadMinima, Integer edadMaxima,
                                         List<ConfigurarDoctorRequest.AgendaEntryRequest> agendaRequests) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Doctor no encontrado"));

        Especialidad especialidad = especialidadRepository.findByCodEspecialidadAndFechaHastaIsNull(codEspecialidad)
                .orElseThrow(() -> new IllegalArgumentException("Especialidad no encontrada o inactiva"));

        doctor.setEspecialidad(especialidad);
        doctor.setEdadMinima(edadMinima);
        doctor.setEdadMaxima(edadMaxima);

        // Limpiar agenda existente si la hubiera (por ejemplo si re-configura)
        doctor.getAgendas().clear();

        // Cargar las nuevas entradas de agenda
        if (agendaRequests != null) {
            for (var entry : agendaRequests) {
                AgendaDoctor ad = AgendaDoctor.builder()
                        .doctor(doctor)
                        .diaSemana(entry.getDiaSemana())
                        .horaInicio(entry.getHoraInicio())
                        .horaFin(entry.getHoraFin())
                        .tiempoMaximoEspera(entry.getTiempoMaximoEspera() != null ? entry.getTiempoMaximoEspera() : 15)
                        .activa(true)
                        .build();
                doctor.getAgendas().add(ad);
            }
        }
        doctorRepository.save(doctor);
    }

    private void validarUsuario(String usuario) {
        if (empleadoRepository.findByUsuarioAndFechaHastaEmpleadoIsNull(usuario).isPresent()) {
            throw new IllegalArgumentException("El usuario ya se encuentra registrado y activo");
        }
    }
}
