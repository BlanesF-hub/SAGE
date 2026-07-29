package com.sage.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Getter @Setter
public class RegisterPacienteRequest {

    @NotBlank(message = "El tipo de paciente es obligatorio")
    private String tipoPaciente; // PARTICULAR, OBRA_SOCIAL, PAMI

    @NotBlank(message = "El nombre es obligatorio")
    private String nombrePaciente;

    @NotBlank(message = "El nombre de usuario es obligatorio")
    private String usuario;

    @NotBlank(message = "La contraseña es obligatoria")
    private String contrasena;

    @NotNull(message = "El DNI es obligatorio")
    private Integer dniPaciente;

    private String nroTelefonoPaciente;

    @NotNull(message = "La fecha de nacimiento es obligatoria")
    private LocalDate fechaNacimiento;

    private String direccionPaciente;

    // Campos PacienteObraSocial
    private Integer nroAfiliado;
    private String codObraSocial;

    // Campos PacientePami
    private Integer nroBeneficiario;
}
