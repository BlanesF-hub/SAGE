package com.sage.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "consultorio")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Consultorio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cod_consultorio", nullable = false, unique = true, length = 20)
    private String codConsultorio;

    @Column(name = "nombre_consultorio", nullable = false, length = 150)
    private String nombreConsultorio;

    @Column(name = "direccion_consultorio")
    private String direccionConsultorio;

    @Column(name = "fecha_desde", nullable = false)
    private LocalDateTime fechaDesde;

    @Column(name = "fecha_hasta")
    private LocalDateTime fechaHasta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "localidad_id", nullable = false)
    private Localidad localidad;

    @PrePersist
    protected void onCreate() {
        if (fechaDesde == null) fechaDesde = LocalDateTime.now();
    }
}
