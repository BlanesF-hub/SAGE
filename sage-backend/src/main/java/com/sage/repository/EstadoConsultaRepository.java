package com.sage.repository;

import com.sage.model.EstadoConsulta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EstadoConsultaRepository extends JpaRepository<EstadoConsulta, Long> {
    List<EstadoConsulta> findByFechaHoraBajaIsNull();
    Optional<EstadoConsulta> findByCodEcAndFechaHoraBajaIsNull(String codEc);
}
