package com.sage.config;

import com.sage.model.Empleado;
import com.sage.model.Paciente;
import com.sage.model.enums.Rol;
import com.sage.repository.EmpleadoRepository;
import com.sage.repository.PacienteRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final EmpleadoRepository empleadoRepository;
    private final PacienteRepository pacienteRepository;

    public CustomUserDetailsService(EmpleadoRepository empleadoRepository, PacienteRepository pacienteRepository) {
        this.empleadoRepository = empleadoRepository;
        this.pacienteRepository = pacienteRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Buscar primero en Empleado
        var empleadoOpt = empleadoRepository.findByUsuarioAndFechaHastaEmpleadoIsNull(username);
        if (empleadoOpt.isPresent()) {
            Empleado emp = empleadoOpt.get();
            Long consultorioId = emp.getConsultorio() != null ? emp.getConsultorio().getId() : null;
            return new CustomUserDetails(
                    emp.getId(),
                    emp.getUsuario(),
                    emp.getContrasena(),
                    emp.getRol(),
                    consultorioId,
                    emp.isForcePasswordChange(),
                    emp.getNombreEmpleado()
            );
        }

        // Buscar en Paciente si no es empleado
        var pacienteOpt = pacienteRepository.findByUsuarioAndFechaHoraBajaIsNull(username);
        if (pacienteOpt.isPresent()) {
            Paciente pac = pacienteOpt.get();
            return new CustomUserDetails(
                    pac.getId(),
                    pac.getUsuario(),
                    pac.getContrasena(),
                    Rol.PACIENTE,
                    null, // El paciente no pertenece a un Ãºnico consultorio
                    false, // Los pacientes no tienen cambio forzado
                    pac.getNombrePaciente()
            );
        }

        throw new UsernameNotFoundException("Usuario no encontrado: " + username);
    }
}
