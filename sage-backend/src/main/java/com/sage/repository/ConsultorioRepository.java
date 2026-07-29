package com.sage.repository;

import com.sage.model.Consultorio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConsultorioRepository extends JpaRepository<Consultorio, Long> {
    List<Consultorio> findByFechaHastaIsNull();
    Optional<Consultorio> findByCodConsultorioAndFechaHastaIsNull(String codConsultorio);
}
