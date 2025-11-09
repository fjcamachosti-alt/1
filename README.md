# AMIGA - Aplicación de Manejo Integral de Gestión de Ambulancias

## Descripción

AMIGA es un sistema empresarial completo diseñado para la gestión integral de empresas de ambulancias. Desarrollado con tecnologías modernas y siguiendo las mejores prácticas de desarrollo, AMIGA proporciona una solución robusta y escalable para el manejo de vehículos, empleados, documentación y operaciones diarias.

## Características Principales

### 🚑 Gestión de Vehículos
- **Registro completo de ambulancias** (matrícula, marca, modelo, año, etc.)
- **Documentación organizada** por categorías (permisos, seguros, ITV, etc.)
- **Sistema de alertas automáticas** para vencimientos
- **Control de mantenimiento** y revisiones periódicas
- **Seguimiento de ubicación** y estado

### 👥 Gestión de Empleados
- **Sistema de roles jerárquico** (Admin, Gestor, Oficina, Técnico, Médico, Enfermero)
- **Documentación laboral completa** (CV, contratos, certificados, etc.)
- **Gestión de vacaciones** y registro de jornada
- **Alertas automáticas** para vencimientos de contratos
- **Control de acceso** basado en roles

### 📊 Panel de Control
- **Dashboard interactivo** con widgets personalizables
- **Estadísticas en tiempo real** de vehículos, empleados y alertas
- **Calendario de mantenimiento** y servicios
- **Accesos rápidos** según rol de usuario
- **Notificaciones push** para eventos importantes

### 🏢 ERP Empresarial
- **Gestión documental completa** de la empresa
- **Categorías organizadas** (escrituras, certificados, contratos, etc.)
- **Control de clientes** y proveedores
- **Facturación integrada** (emitidas y recibidas)
- **Alertas de vencimiento** para documentos corporativos

### 🔐 Seguridad y Auditoría
- **Autenticación JWT** con refresh tokens
- **Control de acceso** basado en roles (RBAC)
- **Auditoría completa** de todas las acciones
- **Encriptación de datos** sensibles
- **Protección contra ataques** (XSS, SQL Injection, Rate Limiting)

### 📱 Interfaz Moderna
- **Diseño responsive** adaptado a todos los dispositivos
- **Colores pastel profesionales** (azul claro, azul medio, blanco)
- **Interfaz intuitiva** y fácil de usar
- **Tema claro** optimizado para trabajo diario
- **Animaciones suaves** y transiciones elegantes

## Tecnologías Utilizadas

### Backend
- **Node.js 16+** con Express.js
- **PostgreSQL 14+** como base de datos principal
- **Redis** para caché y sesiones (opcional)
- **JWT** para autenticación
- **Multer** para gestión de archivos
- **Swagger** para documentación API

### Frontend
- **HTML5/CSS3/JavaScript** vanilla
- **Tailwind CSS** para estilos
- **Font Awesome** para iconos
- **Google Fonts** (Inter, Playfair Display)
- **Diseño modular** y componentizado

### Seguridad
- **Helmet.js** para headers de seguridad
- **Express Rate Limit** para limitación de requests
- **Express Validator** para validación de datos
- **BCrypt** para hash de contraseñas
- **Winston** para logging estructurado

## Instalación

### Requisitos Previos
- Node.js 16 o superior
- PostgreSQL 14 o superior
- Redis 6+ (opcional, para caché)
- Git

### Instalación Rápida con Script de Despliegue

```bash
# Clonar el repositoriogit clone https://github.com/tu-usuario/amiga-gestion-ambulancias.git
cd amiga-gestion-ambulancias

# Hacer ejecutable el script de despliegue
chmod +x deploy.sh

# Ejecutar despliegue completo
./deploy.sh deploy
```

### Instalación Manual

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/amiga-gestion-ambulancias.git
cd amiga-gestion-ambulancias
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. **Configurar base de datos**
```bash
# Crear base de datos
createdb amiga_db

# Sincronizar modelos
npm run db:sync
```

5. **Crear usuario administrador**
```bash
npm run create:admin
```

6. **Iniciar la aplicación**
```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

## Configuración

### Variables de Entorno

```env
# Configuración del servidor
PORT=5000
NODE_ENV=production

# Base de datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=amiga_db
DB_USER=postgres
DB_PASSWORD=tu_contraseña

# JWT
JWT_SECRET=tu-super-secret-jwt-key
JWT_EXPIRE=8h
JWT_REFRESH_SECRET=tu-refresh-secret
JWT_REFRESH_EXPIRE=7d

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-app-password

# Redis (opcional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Seguridad
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Credenciales por Defecto

**Usuario Administrador:**
- Usuario: `apisistem`
- Contraseña: `apisistem`

⚠️ **IMPORTANTE:** Cambie la contraseña después del primer inicio de sesión.

## Uso

### Primer Inicio

1. Acceder a `http://localhost:5000`
2. Iniciar sesión con las credenciales por defecto
3. Cambiar la contraseña inmediatamente
4. Configurar los parámetros de la empresa
5. Comenzar a registrar vehículos y empleados

### Navegación Principal

- **Panel de Control:** Vista general con estadísticas y accesos rápidos
- **Vehículos:** Gestión completa de la flota de ambulancias
- **Empleados:** Administración del personal y documentación
- **ERP:** Documentación empresarial y gestión administrativa
- **Alertas:** Sistema de notificaciones y recordatorios

### Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **Administrador** | Acceso total a todas las funcionalidades |
| **Gestor** | Gestión operativa completa |
| **Oficina** | Permisos configurables según necesidades |
| **Técnico** | Datos personales + vehículos asignados |
| **Médico/Enfermero** | Datos personales + checklist + inventario médico |

## API REST

La aplicación incluye una API REST completamente documentada con Swagger:

- **Documentación interactiva:** `http://localhost:5000/api-docs`
- **Endpoints principales:**
  - `/api/auth` - Autenticación
  - `/api/vehicles` - Gestión de vehículos
  - `/api/users` - Gestión de usuarios
  - `/api/alerts` - Sistema de alertas
  - `/api/erp` - Gestión empresarial
  - `/api/audit` - Auditoría

## Estructura del Proyecto

```
amiga-gestion-ambulancias/
├── config/                 # Configuraciones
├── middleware/             # Middlewares
├── models/                 # Modelos de base de datos
├── public/                 # Archivos estáticos
├── routes/                 # Rutas de la API
├── uploads/                # Archivos subidos
├── scripts/                # Scripts de utilidad
├── logs/                   # Archivos de log
├── server.js               # Servidor principal
├── package.json            # Dependencias
├── deploy.sh               # Script de despliegue
└── README.md               # Documentación
```

## Seguridad

### Medidas Implementadas

1. **Autenticación y Autorización**
   - JWT con refresh tokens
   - Control de acceso basado en roles (RBAC)
   - Sesiones seguras

2. **Protección de Datos**
   - Hash de contraseñas con BCrypt
   - Validación de entrada de datos
   - Sanitización de inputs

3. **Seguridad de Aplicación**
   - Headers de seguridad con Helmet
   - Rate limiting
   - Protección CORS
   - Auditoría completa de acciones

4. **Seguridad de Base de Datos**
   - Uso de prepared statements
   - Validación de datos
   - Encriptación de información sensible

### Recomendaciones de Seguridad

- Cambiar las contraseñas por defecto inmediatamente
- Usar HTTPS en producción
- Configurar firewall apropiadamente
- Realizar backups regulares
- Mantener el sistema actualizado
- Monitorear logs de auditoría

## Monitoreo y Mantenimiento

### Logs del Sistema

- **Logs de aplicación:** `/logs/app.log`
- **Logs de auditoría:** `/logs/audit.log`
- **Logs de errores:** `/logs/error.log`

### Monitoreo

El script de despliegue configura monitoreo básico que verifica:
- Estado del proceso
- Uso de memoria
- Espacio en disco
- Conectividad

### Mantenimiento

1. **Actualizaciones**
```bash
# Actualizar dependencias
npm update

# Verificar vulnerabilidades
npm audit
npm audit fix
```

2. **Backups**
```bash
# Backup de base de datos
pg_dump amiga_db > backup_$(date +%Y%m%d).sql

# Backup de archivos
tar -czf backup_$(date +%Y%m%d).tar.gz uploads/ logs/
```

3. **Limpieza**
```bash
# Limpiar logs antiguos
find logs/ -name "*.log" -mtime +30 -delete

# Limpiar archivos temporales
npm run clean
```

## Solución de Problemas

### Problemas Comunes

1. **Error de conexión a base de datos**
   - Verificar credenciales en .env
   - Asegurar que PostgreSQL esté ejecutándose
   - Verificar firewall y puertos

2. **Error de autenticación**
   - Verificar JWT secrets
   - Limpiar cookies del navegador
   - Verificar usuario y contraseña

3. **Error de subida de archivos**
   - Verificar permisos del directorio uploads/
   - Verificar límites de tamaño en .env
   - Verificar configuración de nginx (si aplica)

### Soporte

Para reportar problemas o solicitar ayuda:
1. Verificar logs del sistema
2. Consultar documentación de la API
3. Crear un issue en el repositorio
4. Contactar al equipo de desarrollo

## Contribuir

Para contribuir al proyecto:
1. Fork el repositorio
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## Agradecimientos

- Equipo de desarrollo de AMIGA
- Comunidad open source
- Contribuyentes del proyecto

---

**AMIGA - Aplicación de Manejo Integral de Gestión de Ambulancias**  
*Desarrollado con ❤️ para el sector de emergencias médicas*