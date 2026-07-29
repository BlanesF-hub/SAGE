package com.sage.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Paciente base con SINGLE_TABLE inheritance.
 * Discriminator: tipo_paciente = {PARTICULAR, OBRA_SOCIAL, PAMI}
 */
@Entity
@Table(name = "paciente")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "tipo_paciente", discriminatorType = DiscriminatorType.STRING, length = 30)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Paciente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cod_paciente", nullable = false, unique = true, length = 20)
    private String codPaciente;

    @Column(name = "nombre_paciente", nullable = false, length = 150)
    private String nombrePaciente;

    @Column(nullable = false, unique = true, length = 50)
    private String usuario;

    @Column(nullable = false)
    private String contrasena;

    @Column(name = "dni_paciente", nullable = false, unique = true)
    private Integer dniPaciente;

    @Column(name = "nro_telefono_paciente", length = 20)
    private String nroTelefonoPaciente;

    @Column(name = "fecha_nacimiento", nullable = false)
    private LocalDate fechaNacimiento;

    @Column(name = "direccion_paciente")
    private String direccionPaciente;

    @Column(name = "fecha_hora_alta", nullable = false)
    private LocalDateTime fechaHoraAlta;

    @Column(name = "fecha_hora_baja")
    private LocalDateTime fechaHoraBaja;

    @PrePersist
    protected void onCreate() {
        if (fechaHoraAlta == null) fechaHoraAlta = LocalDateTime.now();
    }

    /**
     * Calcula la edad actual del paciente.
     */
    @Transient
    public int getEdad() {
        return java.time.Period.between(fechaNacimiento, LocalDate.now()).getYears();
    }
}
