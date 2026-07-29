package com.sage.controller;

import com.sage.model.*;
import com.sage.model.enums.Rol;
import com.sage.repository.ConsultorioRepository;
import com.sage.repository.EmpleadoRepository;
import com.sage.service.abm.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final ZonaService zonaService;
    private final LocalidadService localidadService;
    private final ConsultorioService consultorioService;
    private final EspecialidadService especialidadService;
    private final ObraSocialService obraSocialService;
    private final TipoTurnoService tipoTurnoService;
    private final EstadoConsultaService estadoConsultaService;
    
    private final EmpleadoRepository empleadoRepository;
    private final ConsultorioRepository consultorioRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminController(ZonaService zonaService, LocalidadService localidadService,
                           ConsultorioService consultorioService, EspecialidadService especialidadService,
                           ObraSocialService obraSocialService, TipoTurnoService tipoTurnoService,
                           EstadoConsultaService estadoConsultaService, EmpleadoRepository empleadoRepository,
                           ConsultorioRepository consultorioRepository, PasswordEncoder passwordEncoder) {
        this.zonaService = zonaService;
        this.localidadService = localidadService;
        this.consultorioService = consultorioService;
        this.especialidadService = especialidadService;
        this.obraSocialService = obraSocialService;
        this.tipoTurnoService = tipoTurnoService;
        this.estadoConsultaService = estadoConsultaService;
        this.empleadoRepository = empleadoRepository;
        this.consultorioRepository = consultorioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ── Zonas ──
    @GetMapping("/zonas")
    public List<Zona> listarZonas() { return zonaService.listarActivos(); }

    @PostMapping("/zonas")
    public Zona crearZona(@RequestBody Zona zona) { return zonaService.crear(zona); }

    @PutMapping("/zonas/{id}")
    public Zona actualizarZona(@PathVariable Long id, @RequestBody Zona zona) { return zonaService.actualizar(id, zona); }

    @DeleteMapping("/zonas/{id}")
    public void bajaZona(@PathVariable Long id) { zonaService.darDeBaja(id); }

    // ── Localidades ──
    @GetMapping("/localidades")
    public List<Localidad> listarLocalidades() { return localidadService.listarActivos(); }

    @PostMapping("/localidades")
    public Localidad crearLocalidad(@RequestBody Localidad localidad, @RequestParam Long zonaId) { 
        return localidadService.crear(localidad, zonaId); 
    }

    @PutMapping("/localidades/{id}")
    public Localidad actualizarLocalidad(@PathVariable Long id, @RequestBody Localidad localidad, @RequestParam Long zonaId) { 
        return localidadService.actualizar(id, localidad, zonaId); 
    }

    @DeleteMapping("/localidades/{id}")
    public void bajaLocalidad(@PathVariable Long id) { localidadService.darDeBaja(id); }

    // ── Consultorios ──
    @GetMapping("/consultorios")
    public List<Consultorio> listarConsultorios() { return consultorioService.listarActivos(); }

    @PostMapping("/consultorios")
    public Consultorio crearConsultorio(@RequestBody Consultorio consultorio, @RequestParam Long localidadId) { 
        return consultorioService.crear(consultorio, localidadId); 
    }

    @PutMapping("/consultorios/{id}")
    public Consultorio actualizarConsultorio(@PathVariable Long id, @RequestBody Consultorio consultorio, @RequestParam Long localidadId) { 
        return consultorioService.actualizar(id, consultorio, localidadId); 
    }

    @DeleteMapping("/consultorios/{id}")
    public void bajaConsultorio(@PathVariable Long id) { consultorioService.darDeBaja(id); }

    // ── Especialidades ──
    @GetMapping("/especialidades")
    public List<Especialidad> listarEspecialidades() { return especialidadService.listarActivos(); }

    @PostMapping("/especialidades")
    public Especialidad crearEspecialidad(@RequestBody Especialidad esp) { return especialidadService.crear(esp); }

    @PutMapping("/especialidades/{id}")
    public Especialidad actualizarEspecialidad(@PathVariable Long id, @RequestBody Especialidad esp) { return especialidadService.actualizar(id, esp); }

    @DeleteMapping("/especialidades/{id}")
    public void bajaEspecialidad(@PathVariable Long id) { especialidadService.darDeBaja(id); }

    // ── Obras Sociales ──
    @GetMapping("/obras-sociales")
    public List<ObraSocial> listarObrasSociales() { return obraSocialService.listarActivos(); }

    @PostMapping("/obras-sociales")
    public ObraSocial crearObraSocial(@RequestBody ObraSocial os) { return obraSocialService.crear(os); }

    @PutMapping("/obras-sociales/{id}")
    public ObraSocial actualizarObraSocial(@PathVariable Long id, @RequestBody ObraSocial os) { return obraSocialService.actualizar(id, os); }

    @DeleteMapping("/obras-sociales/{id}")
    public void bajaObraSocial(@PathVariable Long id) { obraSocialService.darDeBaja(id); }

    // ── Tipos de Turno ──
    @GetMapping("/tipos-turno")
    public List<TipoTurno> listarTiposTurno() { return tipoTurnoService.listarActivos(); }

    @PostMapping("/tipos-turno")
    public TipoTurno crearTipoTurno(@RequestBody TipoTurno tt) { return tipoTurnoService.crear(tt); }

    @DeleteMapping("/tipos-turno/{id}")
    public void bajaTipoTurno(@PathVariable Long id) { tipoTurnoService.darDeBaja(id); }

    // ── Estados Consulta ──
    @GetMapping("/estados-consulta")
    public List<EstadoConsulta> listarEstadosConsulta() { return estadoConsultaService.listarActivos(); }

    @PostMapping("/estados-consulta")
    public EstadoConsulta crearEstadoConsulta(@RequestBody EstadoConsulta ec) { return estadoConsultaService.crear(ec); }

    // ── Registrar Administrador de Consultorio ──
    @PostMapping("/admins-consultorio")
    public ResponseEntity<String> registrarAdminConsultorio(@RequestParam String usuario, 
                                                             @RequestParam String contrasena, 
                                                             @RequestParam String nombre, 
                                                             @RequestParam Long consultorioId) {
        if (empleadoRepository.findByUsuarioAndFechaHastaEmpleadoIsNull(usuario).isPresent()) {
            throw new IllegalArgumentException("El usuario ya existe");
        }
        Consultorio cons = consultorioRepository.findById(consultorioId)
                .orElseThrow(() -> new IllegalArgumentException("Consultorio no encontrado"));

        Empleado emp = new Empleado();
        emp.setUsuario(usuario);
        emp.setContrasena(passwordEncoder.encode(contrasena));
        emp.setNombreEmpleado(nombre);
        emp.setRol(Rol.ADMIN_CONSULTORIO);
        emp.setConsultorio(cons);
        emp.setForcePasswordChange(false); // Los administradores directos no requieren forzado en este flujo
        
        empleadoRepository.save(emp);
        return ResponseEntity.ok("Administrador de consultorio registrado exitosamente");
    }
}
