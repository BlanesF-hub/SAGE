package com.sage.model.enums;

/**
 * Estados posibles de un Turno durante su ciclo de vida.
 */
public enum EstadoTurno {
    LIBRE,          // Slot disponible sin paciente asignado
    ASIGNADO,       // Paciente tomó el turno (pendiente de confirmación)
    CONFIRMADO,     // Paciente confirmó por WhatsApp (24h antes)
    PRESENTE,       // Secretario marcó al paciente como presente
    EN_CONSULTA,    // Doctor inició la consulta
    FINALIZADO,     // Consulta completada
    RECHAZADO,      // No se presentó dentro del tiempo máximo de espera
    REASIGNADO,     // Secretario reasignó a otro horario/día
    CANCELADO       // Cancelado por paciente o secretario
}
