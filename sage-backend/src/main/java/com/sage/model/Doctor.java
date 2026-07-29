package com.sage.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "doctor")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Doctor extends Empleado {

    @Column(name = "cod_doctor", nullable = false, unique = true, length = 20)
    private String codDoctor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "especialidad_id")
    private Especialidad especialidad;

    /**
     * Restricción de edad: edad mínima del paciente.
     * null = sin restricción mínima.
     */
    @Column(name = "edad_minima")
    private Integer edadMinima;

    /**
     * Restricción de edad: edad máxima del paciente.
     * null = sin máximo (opción "sin máximo" solicitada por el usuario).
     */
    @Column(name = "edad_maxima")
    private Integer edadMaxima;

    @OneToMany(mappedBy = "doctor", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AgendaDoctor> agendas = new ArrayList<>();
}
