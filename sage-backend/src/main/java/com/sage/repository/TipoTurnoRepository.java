package com.sage.repository;

import com.sage.model.TipoTurno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TipoTurnoRepository extends JpaRepository<TipoTurno, Long> {
    List<TipoTurno> findByFechaHoraBajaIsNull();
    Optional<TipoTurno> findByCodTipoTurnoAndFechaHoraBajaIsNull(String codTipoTurno);
}
