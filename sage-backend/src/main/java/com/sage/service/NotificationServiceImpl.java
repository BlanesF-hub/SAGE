package com.sage.service;

import com.sage.model.Turno;
import org.springframework.stereotype.Service;

@Service
public class NotificationServiceImpl implements NotificationService {

    @Override
    public void enviarAsignacionTurno(Turno turno) {
        String tel = turno.getPaciente().getNroTelefonoPaciente();
        String msg = String.format("Hola %s, tu turno ha sido reservado para el %s a las %s con el Dr. %s.",
                turno.getPaciente().getNombrePaciente(),
                turno.getFechaHoraPlanificado().toLocalDate(),
                turno.getFechaHoraPlanificado().toLocalTime(),
                turno.getDoctor().getNombreEmpleado());
        System.out.println("[WHATSAPP STUB] Enviando a " + tel + ": " + msg);
    }

    @Override
    public void enviarReasignacionTurno(Turno turno) {
        String tel = turno.getPaciente().getNroTelefonoPaciente();
        String msg = String.format("Hola %s, tu turno ha sido reasignado para el %s a las %s con el Dr. %s.",
                turno.getPaciente().getNombrePaciente(),
                turno.getFechaHoraPlanificado().toLocalDate(),
                turno.getFechaHoraPlanificado().toLocalTime(),
                turno.getDoctor().getNombreEmpleado());
        System.out.println("[WHATSAPP STUB] Enviando a " + tel + ": " + msg);
    }

    @Override
    public void enviarRecordatorioTurno(Turno turno) {
        String tel = turno.getPaciente().getNroTelefonoPaciente();
        String msg = String.format("Hola %s, te recordamos tu turno de mañana %s a las %s. Por favor confirma ingresando al sistema.",
                turno.getPaciente().getNombrePaciente(),
                turno.getFechaHoraPlanificado().toLocalDate(),
                turno.getFechaHoraPlanificado().toLocalTime());
        System.out.println("[WHATSAPP STUB] Enviando a " + tel + ": " + msg);
    }
}
