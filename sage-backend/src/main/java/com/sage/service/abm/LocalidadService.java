package com.sage.service.abm;

import com.sage.model.Localidad;
import com.sage.model.Zona;
import com.sage.repository.LocalidadRepository;
import com.sage.repository.ZonaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class LocalidadService {

    private final LocalidadRepository repository;
    private final ZonaRepository zonaRepository;

    public LocalidadService(LocalidadRepository repository, ZonaRepository zonaRepository) {
        this.repository = repository;
        this.zonaRepository = zonaRepository;
    }

    public List<Localidad> listarActivos() {
        return repository.findByFechaHastaIsNull();
    }

    @Transactional
    public Localidad crear(Localidad localidad, Long zonaId) {
        if (repository.findByCodLocalidadAndFechaHastaIsNull(localidad.getCodLocalidad()).isPresent()) {
            throw new IllegalArgumentException("Código de localidad ya existe y está activo");
        }
        Zona zona = zonaRepository.findById(zonaId)
                .orElseThrow(() -> new IllegalArgumentException("Zona asociada no encontrada"));
        
        localidad.setZona(zona);
        localidad.setFechaDesde(LocalDateTime.now());
        localidad.setFechaHasta(null);
        return repository.save(localidad);
    }

    @Transactional
    public Localidad actualizar(Long id, Localidad datos, Long zonaId) {
        Localidad existente = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Localidad no encontrada"));
        Zona zona = zonaRepository.findById(zonaId)
                .orElseThrow(() -> new IllegalArgumentException("Zona asociada no encontrada"));
        
        existente.setNombreLocalidad(datos.getNombreLocalidad());
        existente.setZona(zona);
        return repository.save(existente);
    }

    @Transactional
    public void darDeBaja(Long id) {
        Localidad existente = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Localidad no encontrada"));
        existente.setFechaHasta(LocalDateTime.now());
        repository.save(existente);
    }
}
