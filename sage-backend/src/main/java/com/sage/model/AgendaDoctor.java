package com.sage.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalTime;

/**
 * Define un bloque de atención del doctor para un día de la semana.
 * Los turnos se generan automáticamente cada 30 min dentro del rango [horaInicio, horaFin).
 */
@Entity
@Table(name = "agenda_doctor",
       uniqueConstraints = @UniqueConstraint(columnNames = {"doctor_id", "dia_semana"}))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AgendaDoctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    /**
     * Día de la semana: 1=Lunes, 2=Martes, ..., 7=Domingo
     */
    @Column(name = "dia_semana", nullable = false)
    private Integer diaSemana;

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    @Column(name = "hora_fin", nullable = false)
    private LocalTime horaFin;

    /**
     * Tiempo máximo en minutos que el paciente tiene para presentarse
     * en recepción antes de ser considerado falta (RECHAZADO).
     */
    @Column(name = "tiempo_maximo_espera", nullable = false)
    @Builder.Default
    private Integer tiempoMaximoEspera = 15;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activa = true;
}
