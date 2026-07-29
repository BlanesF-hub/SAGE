package com.sage.repository;

import com.sage.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Optional<Doctor> findByCodDoctor(String codDoctor);
    List<Doctor> findByConsultorioIdAndFechaHastaEmpleadoIsNull(Long consultorioId);
}
