package com.sage.repository;

import com.sage.model.Localidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface LocalidadRepository extends JpaRepository<Localidad, Long> {
    List<Localidad> findByFechaHastaIsNull();
    Optional<Localidad> findByCodLocalidadAndFechaHastaIsNull(String codLocalidad);
}
