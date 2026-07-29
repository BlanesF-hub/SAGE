package com.sage.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "estado_consulta")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class EstadoConsulta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cod_ec", nullable = false, unique = true, length = 20)
    private String codEc;

    @Column(name = "nombre_ec", nullable = false, length = 50)
    private String nombreEc;

    @Column(name = "fecha_hora_baja")
    private LocalDateTime fechaHoraBaja;
}
