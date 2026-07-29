package com.sage.repository;

import com.sage.model.ConsultaEstado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ConsultaEstadoRepository extends JpaRepository<ConsultaEstado, Long> {
    List<ConsultaEstado> findByConsultaIdOrderByOrdenCeAsc(Long consultaId);
}
