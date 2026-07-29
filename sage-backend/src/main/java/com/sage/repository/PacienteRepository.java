package com.sage.repository;

import com.sage.model.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PacienteRepository extends JpaRepository<Paciente, Long> {
    Optional<Paciente> findByUsuarioAndFechaHoraBajaIsNull(String usuario);
    Optional<Paciente> findByDniPacienteAndFechaHoraBajaIsNull(Integer dni);
}
