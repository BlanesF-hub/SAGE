package com.sage.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class RegisterEmpleadoRequest {

    @NotBlank(message = "El rol es obligatorio")
    private String rol; // ADMIN_GENERAL, ADMIN_CONSULTORIO, SECRETARIO, DOCTOR

    @NotBlank(message = "El nombre de usuario es obligatorio")
    private String usuario;

    @NotBlank(message = "La contraseña es obligatoria")
    private String contrasena;

    @NotBlank(message = "El nombre del empleado es obligatorio")
    private String nombreEmpleado;

    private String nroTelefono;
    private String codEspecialidad;
}
