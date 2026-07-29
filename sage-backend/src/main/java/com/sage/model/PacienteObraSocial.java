package com.sage.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@DiscriminatorValue("OBRA_SOCIAL")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class PacienteObraSocial extends Paciente {

    @Column(name = "nro_afiliado")
    private Integer nroAfiliado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "obra_social_id")
    private ObraSocial obraSocial;
}
