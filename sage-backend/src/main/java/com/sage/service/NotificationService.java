package com.sage.service;

import com.sage.model.Turno;

public interface NotificationService {
    void enviarAsignacionTurno(Turno turno);
    void enviarReasignacionTurno(Turno turno);
    void enviarRecordatorioTurno(Turno turno);
}
