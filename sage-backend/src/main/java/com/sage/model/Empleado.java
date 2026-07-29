package com.sage.model;

import com.sage.model.enums.Rol;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Clase base abstracta para empleados del consultorio.
 * Herencia JOINED: cada subtipo (Secretario, Doctor) tiene su propia tabla
 * que referencia a empleado(id) como PK/FK.
 */
@Entity
@Table(name = "empleado")
@Inheritance(strategy = InheritanceType.JOINED)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Empleado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String usuario;

    @Column(nullable = false)
    private String contrasena;

    @Column(name = "nombre_empleado", nullable = false, length = 150)
    private String nombreEmpleado;

    @Column(name = "nro_telefono", length = 20)
    private String nroTelefono;

    @Column(name = "fecha_desde_empleado", nullable = false)
    private LocalDateTime fechaDesdeEmpleado;

    @Column(name = "fecha_hasta_empleado")
    private LocalDateTime fechaHastaEmpleado;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Rol rol;

    @Column(name = "force_password_change", nullable = false)
    private boolean forcePasswordChange = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultorio_id")
    private Consultorio consultorio;

    @PrePersist
    protected void onCreate() {
        if (fechaDesdeEmpleado == null) fechaDesdeEmpleado = LocalDateTime.now();
    }
}
