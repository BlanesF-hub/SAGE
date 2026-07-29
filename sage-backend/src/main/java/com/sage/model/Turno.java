package com.sage.model;

import com.sage.model.enums.EstadoTurno;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "turno")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Turno {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nro_turno", insertable = false, updatable = false)
    private Integer nroTurno;

    @Column(name = "fecha_hora_planificado", nullable = false)
    private LocalDateTime fechaHoraPlanificado;

    @Column(name = "fecha_hora_inicio")
    private LocalDateTime fechaHoraInicio;

    @Column(name = "fecha_hora_fin")
    private LocalDateTime fechaHoraFin;

    @Column(name = "descripcion_turno", columnDefinition = "TEXT")
    private String descripcionTurno;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private EstadoTurno estado = EstadoTurno.LIBRE;

    @Column(nullable = false)
    @Builder.Default
    private boolean confirmado = false;

    @Column(name = "recordatorio_enviado", nullable = false)
    @Builder.Default
    private boolean recordatorioEnviado = false;

    /**
     * Prioridad de la urgencia: 1, 2, o 3.
     * Solo aplicable para turnos de tipo URGENCIA.
     */
    @Column(name = "prioridad_urgencia")
    private Integer prioridadUrgencia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_turno_id", nullable = false)
    private TipoTurno tipoTurno;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id")
    private Paciente paciente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;
}
