package com.sage.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "obra_social")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ObraSocial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cod_obra_social", nullable = false, unique = true, length = 20)
    private String codObraSocial;

    @Column(name = "nombre_obra_social", nullable = false, length = 150)
    private String nombreObraSocial;

    @Column(name = "fecha_desde", nullable = false)
    private LocalDateTime fechaDesde;

    @Column(name = "fecha_hasta")
    private LocalDateTime fechaHasta;

    @PrePersist
    protected void onCreate() {
        if (fechaDesde == null) fechaDesde = LocalDateTime.now();
    }
}
