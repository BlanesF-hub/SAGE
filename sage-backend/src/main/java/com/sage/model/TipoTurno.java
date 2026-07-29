package com.sage.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tipo_turno")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TipoTurno {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cod_tipo_turno", nullable = false, unique = true, length = 20)
    private String codTipoTurno;

    @Column(name = "nombre_tipo_turno", nullable = false, length = 50)
    private String nombreTipoTurno;

    @Column(name = "fecha_hora_baja")
    private LocalDateTime fechaHoraBaja;
}
