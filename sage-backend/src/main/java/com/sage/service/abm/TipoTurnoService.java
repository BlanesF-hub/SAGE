package com.sage.service.abm;

import com.sage.model.TipoTurno;
import com.sage.repository.TipoTurnoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TipoTurnoService {

    private final TipoTurnoRepository repository;

    public TipoTurnoService(TipoTurnoRepository repository) {
        this.repository = repository;
    }

    public List<TipoTurno> listarActivos() {
        return repository.findByFechaHoraBajaIsNull();
    }

    @Transactional
    public TipoTurno crear(TipoTurno tipoTurno) {
        if (repository.findByCodTipoTurnoAndFechaHoraBajaIsNull(tipoTurno.getCodTipoTurno()).isPresent()) {
            throw new IllegalArgumentException("Código de Tipo Turno ya existe y está activo");
        }
        tipoTurno.setFechaHoraBaja(null);
        return repository.save(tipoTurno);
    }

    @Transactional
    public TipoTurno actualizar(Long id, TipoTurno datos) {
        TipoTurno existente = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tipo Turno no encontrado"));
        existente.setNombreTipoTurno(datos.getNombreTipoTurno());
        return repository.save(existente);
    }

    @Transactional
    public void darDeBaja(Long id) {
        TipoTurno existente = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tipo Turno no encontrado"));
        existente.setFechaHoraBaja(LocalDateTime.now());
        repository.save(existente);
    }
}
