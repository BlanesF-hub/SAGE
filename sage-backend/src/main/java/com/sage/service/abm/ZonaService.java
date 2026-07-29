package com.sage.service.abm;

import com.sage.model.Zona;
import com.sage.repository.ZonaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ZonaService {

    private final ZonaRepository repository;

    public ZonaService(ZonaRepository repository) {
        this.repository = repository;
    }

    public List<Zona> listarActivos() {
        return repository.findByFechaHastaIsNull();
    }

    @Transactional
    public Zona crear(Zona zona) {
        if (repository.findByCodZonaAndFechaHastaIsNull(zona.getCodZona()).isPresent()) {
            throw new IllegalArgumentException("Código de zona ya existe y está activo");
        }
        zona.setFechaDesde(LocalDateTime.now());
        zona.setFechaHasta(null);
        return repository.save(zona);
    }

    @Transactional
    public Zona actualizar(Long id, Zona datos) {
        Zona existente = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Zona no encontrada"));
        existente.setNombreZona(datos.getNombreZona());
        return repository.save(existente);
    }

    @Transactional
    public void darDeBaja(Long id) {
        Zona existente = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Zona no encontrada"));
        existente.setFechaHasta(LocalDateTime.now());
        repository.save(existente);
    }
}
