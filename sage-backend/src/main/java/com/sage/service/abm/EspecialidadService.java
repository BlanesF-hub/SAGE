package com.sage.service.abm;

import com.sage.model.Especialidad;
import com.sage.repository.EspecialidadRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class EspecialidadService {

    private final EspecialidadRepository repository;

    public EspecialidadService(EspecialidadRepository repository) {
        this.repository = repository;
    }

    public List<Especialidad> listarActivos() {
        return repository.findByFechaHastaIsNull();
    }

    @Transactional
    public Especialidad crear(Especialidad especialidad) {
        if (repository.findByCodEspecialidadAndFechaHastaIsNull(especialidad.getCodEspecialidad()).isPresent()) {
            throw new IllegalArgumentException("Código de especialidad ya existe y está activo");
        }
        especialidad.setFechaDesde(LocalDateTime.now());
        especialidad.setFechaHasta(null);
        return repository.save(especialidad);
    }

    @Transactional
    public Especialidad actualizar(Long id, Especialidad datos) {
        Especialidad existente = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Especialidad no encontrada"));
        existente.setNombreEspecialidad(datos.getNombreEspecialidad());
        return repository.save(existente);
    }

    @Transactional
    public void darDeBaja(Long id) {
        Especialidad existente = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Especialidad no encontrada"));
        existente.setFechaHasta(LocalDateTime.now());
        repository.save(existente);
    }
}
