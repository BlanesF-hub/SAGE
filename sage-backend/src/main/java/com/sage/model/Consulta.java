package com.sage.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "consulta")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Consulta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nro_consulta", insertable = false, updatable = false)
    private Integer nroConsulta;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "turno_id", nullable = false, unique = true)
    private Turno turno;

    @Column(name = "fecha_hora_inicio_consulta")
    private LocalDateTime fechaHoraInicioConsulta;

    @Column(name = "fecha_hora_fin_consulta")
    private LocalDateTime fechaHoraFinConsulta;

    @Column(name = "diagnostico_consulta", columnDefinition = "TEXT")
    private String diagnosticoConsulta;

    @Column(name = "tratamiento_consulta", columnDefinition = "TEXT")
    private String tratamientoConsulta;

    @Column(name = "observaciones_consulta", columnDefinition = "TEXT")
    private String observacionesConsulta;

    @OneToMany(mappedBy = "consulta", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ConsultaEstado> estados = new ArrayList<>();
}
