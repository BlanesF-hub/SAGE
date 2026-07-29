package com.sage.service.abm;

import com.sage.model.ObraSocial;
import com.sage.repository.ObraSocialRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ObraSocialService {

    private final ObraSocialRepository repository;

    public ObraSocialService(ObraSocialRepository repository) {
        this.repository = repository;
    }

    public List<ObraSocial> listarActivos() {
        return repository.findByFechaHastaIsNull();
    }

    @Transactional
    public ObraSocial crear(ObraSocial obraSocial) {
        if (repository.findByCodObraSocialAndFechaHastaIsNull(obraSocial.getCodObraSocial()).isPresent()) {
            throw new IllegalArgumentException("Código de Obra Social ya existe y está activo");
        }
        obraSocial.setFechaDesde(LocalDateTime.now());
        obraSocial.setFechaHasta(null);
        return repository.save(obraSocial);
    }

    @Transactional
    public ObraSocial actualizar(Long id, ObraSocial datos) {
        ObraSocial existente = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Obra Social no encontrada"));
        existente.setNombreObraSocial(datos.getNombreObraSocial());
        return repository.save(existente);
    }

    @Transactional
    public void darDeBaja(Long id) {
        ObraSocial existente = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Obra Social no encontrada"));
        existente.setFechaHasta(LocalDateTime.now());
        repository.save(existente);
    }
}
