package com.sage.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "especialidad")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Especialidad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cod_especialidad", nullable = false, unique = true, length = 20)
    private String codEspecialidad;

    @Column(name = "nombre_especialidad", nullable = false, length = 100)
    private String nombreEspecialidad;

    @Column(name = "fecha_desde", nullable = false)
    private LocalDateTime fechaDesde;

    @Column(name = "fecha_hasta")
    private LocalDateTime fechaHasta;

    @PrePersist
    protected void onCreate() {
        if (fechaDesde == null) fechaDesde = LocalDateTime.now();
    }
}
