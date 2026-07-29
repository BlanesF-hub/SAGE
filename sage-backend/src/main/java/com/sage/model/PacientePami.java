package com.sage.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@DiscriminatorValue("PAMI")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class PacientePami extends Paciente {

    @Column(name = "nro_beneficiario")
    private Integer nroBeneficiario;
}
