package com.sage.repository;

import com.sage.model.AgendaDoctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AgendaDoctorRepository extends JpaRepository<AgendaDoctor, Long> {
    List<AgendaDoctor> findByDoctorIdAndActivaTrue(Long doctorId);
    Optional<AgendaDoctor> findByDoctorIdAndDiaSemanaAndActivaTrue(Long doctorId, Integer diaSemana);
}
