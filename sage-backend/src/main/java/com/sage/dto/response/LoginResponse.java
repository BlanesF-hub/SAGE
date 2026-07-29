package com.sage.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private Long id;
    private String usuario;
    private String nombre;
    private String rol;
    private Long consultorioId;
    private boolean forcePasswordChange;
}
