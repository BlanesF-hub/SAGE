package com.sage.dto.request;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalTime;
import java.util.List;

@Getter @Setter
public class ConfigurarDoctorRequest {
    private String codEspecialidad;
    private Integer edadMinima;
    private Integer edadMaxima;
    private List<AgendaEntryRequest> agenda;

    @Getter @Setter
    public static class AgendaEntryRequest {
        private Integer diaSemana; // 1=Lunes ... 7=Domingo
        private LocalTime horaInicio;
        private LocalTime horaFin;
        private Integer tiempoMaximoEspera;
    }
}
