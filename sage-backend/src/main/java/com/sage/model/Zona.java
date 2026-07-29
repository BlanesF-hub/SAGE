package com.sage.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "zona")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Zona {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cod_zona", nullable = false, unique = true, length = 20)
    private String codZona;

    @Column(name = "nombre_zona", nullable = false, length = 100)
    private String nombreZona;

    @Column(name = "fecha_desde", nullable = false)
    private LocalDateTime fechaDesde;

    @Column(name = "fecha_hasta")
    private LocalDateTime fechaHasta;

    @PrePersist
    protected void onCreate() {
        if (fechaDesde == null) fechaDesde = LocalDateTime.now();
    }
}
