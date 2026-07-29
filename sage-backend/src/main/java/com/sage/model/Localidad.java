package com.sage.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "localidad")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Localidad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cod_localidad", nullable = false, unique = true, length = 20)
    private String codLocalidad;

    @Column(name = "nombre_localidad", nullable = false, length = 100)
    private String nombreLocalidad;

    @Column(name = "fecha_desde", nullable = false)
    private LocalDateTime fechaDesde;

    @Column(name = "fecha_hasta")
    private LocalDateTime fechaHasta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zona_id", nullable = false)
    private Zona zona;

    @PrePersist
    protected void onCreate() {
        if (fechaDesde == null) fechaDesde = LocalDateTime.now();
    }
}
