package com.sage.model.enums;

/**
 * Prioridad asignada por el doctor a una urgencia.
 * P1 = Sobreturno (intercalado), P2 = Final del día, P3 = No es urgencia (rechazada).
 */
public enum PrioridadUrgencia {
    P1,  // Sobreturno - atención inmediata intercalada
    P2,  // Importante - final del día
    P3   // No urgencia - se rechaza, debe sacar turno normal
}
