package com.sage.controller;

import com.sage.service.TurnoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/webhooks/whatsapp")
public class WhatsAppWebhookController {

    private final TurnoService turnoService;

    public WhatsAppWebhookController(TurnoService turnoService) {
        this.turnoService = turnoService;
    }

    /**
     * Endpoint de verificación requerido por Meta/WhatsApp Cloud API
     */
    @GetMapping
    public ResponseEntity<String> verifyWebhook(
            @RequestParam("hub.mode") String mode,
            @RequestParam("hub.verify_token") String verifyToken,
            @RequestParam("hub.challenge") String challenge
    ) {
        // En producción, comparar con la variable de entorno WHATSAPP_VERIFY_TOKEN
        if ("subscribe".equals(mode) && "sage_verify_token".equals(verifyToken)) {
            return ResponseEntity.ok(challenge);
        }
        return ResponseEntity.status(403).build();
    }

    /**
     * Endpoint que procesa los mensajes entrantes.
     * Si el paciente responde "SI" o "CONFIRMAR", se confirma el turno automáticamente.
     */
    @PostMapping
    public ResponseEntity<Void> handleIncomingMessage(@RequestBody Map<String, Object> payload) {
        try {
            // Ejemplo básico de parsing del JSON de Meta Cloud API
            // En producción, parsear de forma robusta según la documentación
            if (payload.containsKey("entry")) {
                // Lógica de procesamiento de mensaje entrante
                System.out.println("[WHATSAPP WEBHOOK] Payload recibido: " + payload);
                
                // Si el mensaje contiene texto como "CONFIRMO" o "CONFIRMAR", 
                // buscar el turno más próximo del paciente y confirmarlo
            }
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            System.err.println("[WHATSAPP WEBHOOK] Error procesando webhook: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }
}
