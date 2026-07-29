package com.sage.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@DiscriminatorValue("PARTICULAR")
@Getter @Setter
@NoArgsConstructor
public class PacienteParticular extends Paciente {
}
