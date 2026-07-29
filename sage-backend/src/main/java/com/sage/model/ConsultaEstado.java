package com.sage.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "consulta_estado")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ConsultaEstado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consulta_id", nullable = false)
    private Consulta consulta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estado_consulta_id", nullable = false)
    private EstadoConsulta estadoConsulta;

    @Column(name = "orden_ce", nullable = false)
    private Integer ordenCe;

    @Column(name = "fecha_hora_inicio", nullable = false)
    private LocalDateTime fechaHoraInicio;

    @Column(name = "fecha_fin")
    private LocalDateTime fechaFin;

    @PrePersist
    protected void onCreate() {
        if (fechaHoraInicio == null) {
            fechaHoraInicio = LocalDateTime.now();
        }
    }
}
