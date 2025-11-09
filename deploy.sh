#!/bin/bash

# Script de Despliegue Automatizado para AMIGA
# Aplicación de Manejo Integral de Gestión de Ambulancias

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables de configuración
PROJECT_NAME="amiga-gestion-ambulancias"
NODE_VERSION="16"
POSTGRES_VERSION="14"
REDIS_VERSION="6"

# Funciones auxiliares
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar requisitos del sistema
check_requirements() {
    log_info "Verificando requisitos del sistema..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js no está instalado. Por favor, instale Node.js ${NODE_VERSION} o superior."
        exit 1
    fi
    
    NODE_CURRENT_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_CURRENT_VERSION" -lt "$NODE_VERSION" ]; then
        log_error "Node.js versión ${NODE_CURRENT_VERSION} detectada. Se requiere versión ${NODE_VERSION} o superior."
        exit 1
    fi
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        log_error "npm no está instalado. Por favor, instale npm."
        exit 1
    fi
    
    # Verificar PostgreSQL
    if ! command -v psql &> /dev/null; then
        log_warning "PostgreSQL client no está instalado. Se requerirá para la base de datos."
    fi
    
    # Verificar Redis (opcional)
    if ! command -v redis-cli &> /dev/null; then
        log_warning "Redis client no está instalado. Redis es opcional para caché."
    fi
    
    log_success "Requisitos del sistema verificados"
}

# Configurar variables de entorno
setup_environment() {
    log_info "Configurando variables de entorno..."
    
    if [ ! -f ".env" ]; then
        log_warning "Archivo .env no encontrado. Creando archivo de ejemplo..."
        
        cat > .env << EOF
# Configuración del servidor
PORT=5000
NODE_ENV=production

# Base de datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=amiga_db
DB_USER=postgres
DB_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=8h
JWT_REFRESH_SECRET=your-refresh-secret-change-this-too
JWT_REFRESH_EXPIRE=7d

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Redis (opcional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Upload settings
UPLOAD_MAX_SIZE=10485760
UPLOAD_DIR=uploads

# Security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
EOF
        
        log_warning "Archivo .env creado. Por favor, edítelo con sus configuraciones reales."
        log_warning " especialmente las contraseñas de base de datos y JWT secrets."
    else
        log_success "Archivo .env encontrado"
    fi
}

# Instalar dependencias
install_dependencies() {
    log_info "Instalando dependencias..."
    
    if [ -f "package.json" ]; then
        npm install
        log_success "Dependencias instaladas"
    else
        log_error "package.json no encontrado"
        exit 1
    fi
}

# Configurar base de datos
setup_database() {
    log_info "Configurando base de datos..."
    
    # Verificar conexión a PostgreSQL
    if ! command -v psql &> /dev/null; then
        log_warning "PostgreSQL client no disponible. Saltando configuración de base de datos."
        return
    fi
    
    # Leer configuración de base de datos
    source .env
    
    # Crear base de datos si no existe
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        log_success "Base de datos $DB_NAME ya existe"
    else
        log_info "Creando base de datos $DB_NAME..."
        createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" || {
            log_error "Error al crear base de datos"
            exit 1
        }
        log_success "Base de datos creada"
    fi
    
    # Ejecutar migraciones (si existen)
    if [ -f "scripts/migrate.js" ]; then
        log_info "Ejecutando migraciones..."
        node scripts/migrate.js
    else
        log_info "Sincronizando modelos..."
        node -e "
            const { sequelize } = require('./models');
            sequelize.sync({ alter: true }).then(() => {
                console.log('Base de datos sincronizada');
                process.exit(0);
            }).catch(err => {
                console.error('Error sincronizando base de datos:', err);
                process.exit(1);
            });
        "
    fi
}

# Crear usuario administrador inicial
create_admin_user() {
    log_info "Creando usuario administrador inicial..."
    
    source .env
    
    node -e "
        const { User } = require('./models');
        const bcrypt = require('bcryptjs');
        
        async function createAdmin() {
            try {
                const existingAdmin = await User.findOne({ where: { username: 'apisistem' } });
                
                if (existingAdmin) {
                    console.log('Usuario administrador ya existe');
                    process.exit(0);
                }
                
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('apisistem', salt);
                
                const admin = await User.create({
                    username: 'apisistem',
                    email: 'admin@apisistem.com',
                    password: hashedPassword,
                    firstName: 'Administrador',
                    lastName: 'Sistema',
                    role: 'admin',
                    isActive: true
                });
                
                console.log('Usuario administrador creado:');
                console.log('Usuario: apisistem');
                console.log('Contraseña: apisistem');
                console.log('IMPORTANTE: Cambie la contraseña después del primer inicio de sesión');
                
                process.exit(0);
            } catch (error) {
                console.error('Error creando usuario administrador:', error);
                process.exit(1);
            }
        }
        
        createAdmin();
    "
}

# Configurar SSL/HTTPS
setup_ssl() {
    log_info "Configurando SSL/HTTPS..."
    
    if [ ! -d "ssl" ]; then
        mkdir -p ssl
        log_warning "Directorio ssl creado. Necesitará certificados SSL para HTTPS."
        log_info "Para desarrollo, puede usar certificados autofirmados:"
        log_info "  openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes"
    fi
}

# Configurar servicios del sistema
setup_systemd() {
    log_info "Configurando servicios del sistema..."
    
    if [ -f "/etc/systemd/system/amiga.service" ]; then
        log_success "Servicio systemd ya existe"
        return
    fi
    
    if [ "$EUID" -ne 0 ]; then
        log_warning "Se requieren privilegios de root para configurar systemd"
        return
    fi
    
    cat > /etc/systemd/system/amiga.service << EOF
[Unit]
Description=AMIGA - Aplicación de Manejo Integral de Gestión de Ambulancias
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$PWD
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=amiga
Environment=NODE_ENV=production
Environment=PORT=5000

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    log_success "Servicio systemd configurado"
}

# Configurar firewall
setup_firewall() {
    log_info "Configurando firewall..."
    
    if ! command -v ufw &> /dev/null; then
        log_warning "ufw no está instalado. Por favor, configure manualmente el firewall."
        return
    fi
    
    # Permitir SSH
    ufw allow ssh
    
    # Permitir HTTP y HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Permitir el puerto de la aplicación
    ufw allow 5000/tcp
    
    log_success "Reglas de firewall configuradas"
    log_warning "Recuerde habilitar el firewall con: sudo ufw enable"
}

# Configurar monitoreo
setup_monitoring() {
    log_info "Configurando monitoreo..."
    
    # Crear script de monitoreo
    cat > scripts/monitor.sh << 'EOF'
#!/bin/bash
# Script de monitoreo para AMIGA

# Verificar que el proceso esté corriendo
if ! pgrep -f "node.*server.js" > /dev/null; then
    echo "$(date): AMIGA no está corriendo. Reiniciando..."
    systemctl restart amiga
fi

# Verificar uso de memoria
MEMORY_USAGE=$(ps aux | grep "node.*server.js" | grep -v grep | awk '{print $4}')
if [ ! -z "$MEMORY_USAGE" ]; then
    if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
        echo "$(date): Alto uso de memoria detectado: $MEMORY_USAGE%"
    fi
fi

# Verificar espacio en disco
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "$(date): Bajo espacio en disco: $DISK_USAGE% usado"
fi
EOF
    
    chmod +x scripts/monitor.sh
    
    # Agregar a crontab
    (crontab -l 2>/dev/null; echo "*/5 * * * * $PWD/scripts/monitor.sh >> /var/log/amiga-monitor.log 2>&1") | crontab -
    
    log_success "Monitoreo configurado"
}

# Función principal de despliegue
deploy() {
    log_info "Iniciando despliegue de AMIGA..."
    
    check_requirements
    setup_environment
    install_dependencies
    setup_database
    create_admin_user
    setup_ssl
    setup_systemd
    setup_firewall
    setup_monitoring
    
    log_success "Despliegue completado exitosamente!"
    log_info "Para iniciar la aplicación:"
    log_info "  npm start"
    log_info "o"
    log_info "  systemctl start amiga (si configuró systemd)"
    
    log_warning "Recuerde cambiar las contraseñas por defecto y configurar SSL para producción"
}

# Función de ayuda
show_help() {
    echo "Script de Despliegue Automatizado para AMIGA"
    echo ""
    echo "Uso: $0 [opciones]"
    echo ""
    echo "Opciones:"
    echo "  deploy    - Ejecutar despliegue completo"
    echo "  check     - Verificar requisitos del sistema"
    echo "  db-setup  - Solo configurar base de datos"
    echo "  ssl-setup - Solo configurar SSL"
    echo "  help      - Mostrar esta ayuda"
    echo ""
    echo "Variables de entorno:"
    echo "  NODE_ENV  - Entorno (development/production)"
    echo "  PORT      - Puerto de la aplicación"
}

# Manejar argumentos del comando
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    check)
        check_requirements
        ;;
    db-setup)
        setup_environment
        setup_database
        create_admin_user
        ;;
    ssl-setup)
        setup_ssl
        ;;
    help)
        show_help
        ;;
    *)
        log_error "Opción no válida: $1"
        show_help
        exit 1
        ;;
esac