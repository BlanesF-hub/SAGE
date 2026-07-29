package com.sage.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "secretario")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Secretario extends Empleado {

    @Column(name = "cod_secretario", nullable = false, unique = true, length = 20)
    private String codSecretario;
}
