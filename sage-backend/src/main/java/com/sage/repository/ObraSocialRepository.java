package com.sage.repository;

import com.sage.model.ObraSocial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ObraSocialRepository extends JpaRepository<ObraSocial, Long> {
    List<ObraSocial> findByFechaHastaIsNull();
    Optional<ObraSocial> findByCodObraSocialAndFechaHastaIsNull(String codObraSocial);
}
