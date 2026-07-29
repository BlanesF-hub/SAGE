# SAGE — Guía de Ejecución Local

Este proyecto consta de tres partes principales:
1. **Base de Datos**: PostgreSQL (levantada fácilmente con Docker Compose).
2. **Backend**: Spring Boot 3 (Java 21/23).
3. **Frontend**: React + TypeScript + Vite.

---

## ⚙️ Requisitos Previos

Asegúrate de tener instalado en tu sistema:
- **Docker & Docker Compose** (para la base de datos).
- **Java JDK 21 o superior**.
- **Node.js** (versión LTS recomendada) para el frontend.

---

## 🚀 Instrucciones de Inicio

### 1. Iniciar la Base de Datos
En la raíz de la carpeta del proyecto, ejecuta el siguiente comando para iniciar el contenedor de PostgreSQL:
```bash
docker-compose up -d
```
*Esto creará la base de datos `sage_db` escuchando en el puerto `5432` con usuario/contraseña `postgres`.*

### 2. Iniciar el Backend (Spring Boot)
1. Dirígete a la carpeta del backend:
   ```bash
   cd sage-backend
   ```
2. Ejecuta la aplicación utilizando el Maven Wrapper provisto en el sistema o tu IDE preferido (como IntelliJ IDEA):
   ```bash
   ./mvnw spring-boot:run
   ```
   *Nota: Flyway se ejecutará automáticamente aplicando el esquema inicial (`V1__init_schema.sql`) y poblando las tablas paramétricas y el usuario administrador.*

### 3. Iniciar el Frontend (React)
1. Dirígete a la carpeta del frontend:
   ```bash
   cd sage-frontend
   ```
2. Instala las dependencias necesarias:
   ```bash
   npm install
   ```
3. Ejecuta el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```
4. Abre tu navegador en [http://localhost:5173](http://localhost:5173).

---

## 🔐 Usuarios de Prueba (Seeds iniciales)

- **Administrador General**:
  - **Usuario**: `admin`
  - **Contraseña**: `admin123`
- **Médicos y Secretarios (creados por Administradores)**:
  - Se crean con una contraseña temporal: `sage123` (el sistema forzará el cambio de contraseña al ingresar por primera vez).
