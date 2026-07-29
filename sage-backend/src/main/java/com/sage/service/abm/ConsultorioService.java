package com.sage.service.abm;

import com.sage.model.Consultorio;
import com.sage.model.Localidad;
import com.sage.repository.ConsultorioRepository;
import com.sage.repository.LocalidadRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ConsultorioService {

    private final ConsultorioRepository repository;
    private final LocalidadRepository localidadRepository;

    public ConsultorioService(ConsultorioRepository repository, LocalidadRepository localidadRepository) {
        this.repository = repository;
        this.localidadRepository = localidadRepository;
    }

    public List<Consultorio> listarActivos() {
        return repository.findByFechaHastaIsNull();
    }

    @Transactional
    public Consultorio crear(Consultorio consultorio, Long localidadId) {
        if (repository.findByCodConsultorioAndFechaHastaIsNull(consultorio.getCodConsultorio()).isPresent()) {
            throw new IllegalArgumentException("Código de consultorio ya existe y está activo");
        }
        Localidad loc = localidadRepository.findById(localidadId)
                .orElseThrow(() -> new IllegalArgumentException("Localidad asociada no encontrada"));

        consultorio.setLocalidad(loc);
        consultorio.setFechaDesde(LocalDateTime.now());
        consultorio.setFechaHasta(null);
        return repository.save(consultorio);
    }

    @Transactional
    public Consultorio actualizar(Long id, Consultorio datos, Long localidadId) {
        Consultorio existente = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Consultorio no encontrado"));
        Localidad loc = localidadRepository.findById(localidadId)
                .orElseThrow(() -> new IllegalArgumentException("Localidad asociada no encontrada"));

        existente.setNombreConsultorio(datos.getNombreConsultorio());
        existente.setDireccionConsultorio(datos.getDireccionConsultorio());
        existente.setLocalidad(loc);
        return repository.save(existente);
    }

    @Transactional
    public void darDeBaja(Long id) {
        Consultorio existente = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Consultorio no encontrado"));
        existente.setFechaHasta(LocalDateTime.now());
        repository.save(existente);
    }
}
