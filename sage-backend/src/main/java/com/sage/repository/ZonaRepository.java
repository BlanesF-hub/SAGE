package com.sage.repository;

import com.sage.model.Zona;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ZonaRepository extends JpaRepository<Zona, Long> {
    List<Zona> findByFechaHastaIsNull();
    Optional<Zona> findByCodZonaAndFechaHastaIsNull(String codZona);
}
