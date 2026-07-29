package com.sage.service.abm;

import com.sage.model.EstadoConsulta;
import com.sage.repository.EstadoConsultaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class EstadoConsultaService {

    private final EstadoConsultaRepository repository;

    public EstadoConsultaService(EstadoConsultaRepository repository) {
        this.repository = repository;
    }

    public List<EstadoConsulta> listarActivos() {
        return repository.findByFechaHoraBajaIsNull();
    }

    @Transactional
    public EstadoConsulta crear(EstadoConsulta estadoConsulta) {
        if (repository.findByCodEcAndFechaHoraBajaIsNull(estadoConsulta.getCodEc()).isPresent()) {
            throw new IllegalArgumentException("Código de Estado Consulta ya existe y está activo");
        }
        estadoConsulta.setFechaHoraBaja(null);
        return repository.save(estadoConsulta);
    }

    @Transactional
    public EstadoConsulta actualizar(Long id, EstadoConsulta datos) {
        EstadoConsulta existente = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Estado Consulta no encontrado"));
        existente.setNombreEc(datos.getNombreEc());
        return repository.save(existente);
    }

    @Transactional
    public void darDeBaja(Long id) {
        EstadoConsulta existente = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Estado Consulta no encontrado"));
        existente.setFechaHoraBaja(LocalDateTime.now());
        repository.save(existente);
    }
}
