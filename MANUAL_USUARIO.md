# Manual de Usuario - AMIGA
## Aplicación de Manejo Integral de Gestión de Ambulancias

### Índice

1. [Introducción](#introducción)
2. [Primeros Pasos](#primeros-pasos)
3. [Sistema de Roles](#sistema-de-roles)
4. [Módulo Vehículos](#módulo-vehículos)
5. [Módulo Empleados](#módulo-empleados)
6. [Panel de Control](#panel-de-control)
7. [Sistema ERP](#sistema-erp)
8. [Sistema de Alertas](#sistema-de-alertas)
9. [Gestión de Documentos](#gestión-de-documentos)
10. [Solución de Problemas](#solución-de-problemas)

---

## Introducción

AMIGA es un sistema integral diseñado para facilitar la gestión empresarial de compañías de ambulancias. Esta guía le ayudará a aprovechar al máximo todas las funcionalidades del sistema.

### Características Principales

- **Interfaz intuitiva** con diseño moderno y colores pastel
- **Gestión centralizada** de toda la información
- **Sistema de alertas** para prevenir vencimientos
- **Control de acceso** según roles y permisos
- **Documentación organizada** por categorías

---

## Primeros Pasos

### Acceso al Sistema

1. Abra su navegador web (Chrome, Firefox, Safari, Edge)
2. Ingrese la URL del sistema
3. Use las credenciales proporcionadas por su administrador

### Pantalla de Login

```
┌─────────────────────────────────┐
│        🚑 AMIGA                 │
│   Aplicación de Gestión de      │
│      Ambulancias               │
├─────────────────────────────────┤
│                                 │
│  Usuario: [_______________]     │
│                                 │
│  Contraseña: [____________]     │
│                                 │
│         [  INICIAR SESIÓN  ]    │
│                                 │
└─────────────────────────────────┘
```

### Primer Inicio de Sesión

**⚠️ IMPORTANTE:** Después del primer inicio de sesión, se le solicitará cambiar su contraseña por seguridad.

1. Ingrese con las credenciales proporcionadas
2. Seleccione una nueva contraseña segura
3. Confirme la nueva contraseña
4. Guarde sus credenciales en un lugar seguro

---

## Sistema de Roles

### Administrador
**Acceso Total** - Puede realizar todas las operaciones del sistema:
- Gestionar usuarios y permisos
- Configurar parámetros del sistema
- Acceder a toda la información
- Generar reportes y estadísticas
- Administrar documentación empresarial

### Gestor
**Gestión Operativa** - Control de operaciones diarias:
- Gestionar vehículos y empleados
- Programar mantenimientos
- Administrar alertas
- Supervisar documentación
- Generar reportes operativos

### Oficina
**Permisos Configurables** - Tareas administrativas:
- Registrar vehículos nuevos
- Gestionar documentación básica
- Consultar información
- Actualizar datos de contacto

### Técnico
**Vehículos Asignados** - Mantenimiento y operación:
- Ver información de vehículos asignados
- Completar checklists de mantenimiento
- Reportar incidencias
- Actualizar datos personales

### Médico/Enfermero
**Área Médica** - Atención sanitaria:
- Acceder a inventario médico
- Completar checklists médicos
- Gestionar registros de pacientes
- Actualizar certificaciones

---

## Panel de Control

### Vista Principal

El Panel de Control es su punto de entrada al sistema, diseñado para proporcionar una visión general rápida de su operación.

```
┌─────────────────────────────────────────────┐
│  🏠 Panel de Control - AMIGA               │
├─────────────────────────────────────────────┤
│                                             │
│  📊 ESTADÍSTICAS RÁPIDAS                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │   24    │ │    18   │ │    7    │      │
│  │Vehículos│ │Empleados│ │Alertas  │      │
│  └─────────┘ └─────────┘ └─────────┘      │
│                                             │
│  ⚡ ACCIONES RÁPIDAS                        │
│  [+ Nuevo Vehículo] [+ Nuevo Empleado]     │
│  [📅 Mantenimiento] [📄 Reporte]           │
│                                             │
│  📋 ACTIVIDAD RECIENTE                     │
│  • ITV próxima - Ambulancia A-123         │
│  • Certificado actualizado - Juan García   │
│  • Mantenimiento completado - B-456       │
│                                             │
└─────────────────────────────────────────────┘
```

### Widgets del Dashboard

1. **Estadísticas Rápidas**
   - Total de vehículos activos
   - Empleados registrados
   - Alertas pendientes
   - Servicios del día

2. **Acciones Rápidas**
   - Botones directos a funciones comunes
   - Personalizadas según su rol
   - Atajos de teclado disponibles

3. **Actividad Reciente**
   - Últimas acciones del sistema
   - Alertas generadas automáticamente
   - Actualizaciones de documentos

---

## Módulo Vehículos

### Vista Principal de Vehículos

```
┌─────────────────────────────────────────────┐
│  🚑 Gestión de Vehículos                   │
├─────────────────────────────────────────────┤
│  [+ Nuevo Vehículo] [🔍 Buscar]           │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │ Matrícula │ Marca │ Modelo │ Estado │  │
│  ├─────────────────────────────────────┤  │
│  │ A-123-BC  │Merc.  │Sprinter│✅ Disp.│  │
│  │ B-456-DE  │Fiat   │Ducato  │🔧 Manto│  │
│  └─────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

### Registro de Nuevo Vehículo

El sistema organiza la información en pestañas para mejor organización:

#### Pestaña 1: Datos Básicos
- **Información General**
  - Matrícula
  - Marca y modelo
  - Año de fabricación
  - Número de chasis
  - Número de motor

- **Estado del Vehículo**
  - Disponibilidad: [Disponible | No Disponible]
  - Visibilidad: [Visible | No Visible] *(solo admin/gestor)*
  - Ubicación actual
  - Kilometraje

#### Pestaña 2: Documentación Básica
Documentos obligatorios para circulación:
- Permiso de Circulación
- Ficha Técnica
- Póliza de seguro
- Recibo de seguro
- ITV Favorable

#### Pestaña 3: Documentación Específica
Documentación adicional según tipo de servicio:
- Memoria técnica
- Administrador Poder Sume
- Certificado del carrocero
- Contrato de alquiler
- Anexo de contrato

#### Pestaña 4: Documentación Adicional
- Varios 1-5 (campos personalizables)
- Notas y observaciones
- Fotografías del vehículo

### Sistema de Alertas Automáticas

El sistema genera alertas automáticas para:

1. **ITV** - 60 días de antelación
2. **Revisiones** - 1000 km de antelación o 30 días
3. **Seguros** - 30 días antes del vencimiento
4. **Mantenimiento** - Según calendario establecido

```
🔔 Alertas Activas:
   • ITV Ambulancia A-123 vence en 45 días
   • Seguro Ambulancia C-789 vence en 12 días ⚠️
   • Mantenimiento B-456 próximo (1500 km)
```

---

## Módulo Empleados

### Registro de Empleados

#### Datos Personales
```
┌─────────────────────────────────────────┐
│  👤 Datos Personales                    │
├─────────────────────────────────────────┤
│  Nombre: [_______________]              │
│  2º Nombre (opc): [_______]             │
│  1º Apellido: [_________]               │
│  2º Apellido: [_________]               │
│  Apodo: [_______________]               │
│                                         │
│  DNI: [_______________]                 │
│  Fecha Nac.: [_________]                │
│  Teléfono: [___________]                │
│  Email: [_____________]                 │
└─────────────────────────────────────────┘
```

#### Documentación Obligatoria
- **Documentos de Identidad**
  - DNI/NIE
  - Fotografía reciente
  - CV actualizado

- **Documentación Laboral**
  - Número de afiliación a Seguridad Social
  - Cuenta bancaria para nómina
  - Certificados penales
  - Documentación PRL (Art. 17, 18, 19)

- **Certificaciones Específicas**
  - Acto médico (para personal sanitario)
  - Certificados de formación
  - Carnet de conducir
  - Licencias especiales

#### Gestión Laboral
- **Contrato**
  - Tipo de contrato
  - Jornada laboral
  - Salario
  - Puesto de trabajo

- **Seguridad Social**
  - Alta en SS
  - IDC (Identificación Digital de Contrato)
  - Comunicación de contrato
  - Certificado de empresa

#### Gestión Temporal
- **Vacaciones**
  - Solicitud y aprobación
  - Calendario de ausencias
  - Saldo de días disponibles

- **Registro de Jornada**
  - Horario de entrada/salida
  - Control de horas extras
  - Partes de incidencia

### Alertas de Empleados

1. **Fin de Contrato** - 30 días de antelación
2. **Vencimiento Certificados** - Según tipo de certificación
3. **Cumpleaños** - Para felicitaciones y registros
4. **Revisiones Médicas** - Según tipo de puesto

---

## Sistema ERP

### Documentación Empresarial

#### Escrituras y Constitución
- Documentación de constitución de la empresa
- Estatutos y modificaciones
- Actas de juntas y reuniones

#### Certificados y Licencias
- Certificados de calidad (ISO, etc.)
- Certificados de solvencia económica
- Certificados de liquidez
- Licencias municipales

#### Contratos Empresariales
- Contratos con trabajadores
- Contratos con clientes
- Contratos con proveedores
- Contratos de servicios

#### Documentación Bancaria
- Líneas de crédito
- Préstamos bancarios
- Hipotecas
- Avales y garantías

#### AEAT (Agencia Tributaria)
- Declaraciones de impuestos
- Modelos tributarios
- Comunicaciones con Hacienda
- Censos y registros

#### Seguridad Social
- Cuotas de Seguridad Social
- Pagos y remesas
- Comunicaciones con TGSS
- Altas y bajas de trabajadores

### Gestión Comercial

#### Clientes
- Ficha de clientes
- Contratos de servicio
- Historial de servicios
- Facturación y pagos

#### Proveedores
- Ficha de proveedores
- Contratos de suministro
- Órdenes de compra
- Facturas recibidas

#### Facturación
- Facturas emitidas
- Facturas recibidas
- Control de cobros/pagos
- Gestión de impagos

---

## Sistema de Alertas

### Tipos de Alertas

1. **ITV** - Recordatorios de inspección técnica
2. **Mantenimiento** - Revisiones periódicas
3. **Seguros** - Vencimiento de pólizas
4. **Documentos** - Caducidad de documentación
5. **Contratos** - Fin de contratos laborales
6. **Médicas** - Revisiones médicas obligatorias
7. **Otras** - Alertas personalizadas

### Prioridades

- **🔴 Urgente** - Requiere acción inmediata (0-3 días)
- **🟡 Alta** - Importante, atender pronto (4-7 días)
- **🟢 Media** - Atender cuando sea posible (8-30 días)
- **🔵 Baja** - Informativa, sin fecha límite

### Gestión de Alertas

```
┌─────────────────────────────────────────┐
│  🔔 Alertas Pendientes                  │
├─────────────────────────────────────────┤
│  ⚠️ Seguro C-789 vence en 12 días      │
│     [Ver Detalles] [✅ Resolver]        │
│                                         │
│  🔧 Mantenimiento B-456 en 500km       │
│     [Programar] [✅ Completar]          │
│                                         │
│  📄 Contrato Juan García vence pronto  │
│     [Ver Empleado] [📅 Renovar]         │
└─────────────────────────────────────────┘
```

---

## Gestión de Documentos

### Subida de Documentos

1. **Seleccionar archivo**
   - Formatos permitidos: PDF, JPG, PNG, DOC, DOCX
   - Tamaño máximo: 10MB por archivo
   - Nombres descriptivos recomendados

2. **Categorizar**
   - Seleccionar tipo de documento
   - Asignar categoría y subcategoría
   - Añadir descripción opcional

3. **Establecer vencimiento**
   - Fecha de emisión (opcional)
   - Fecha de vencimiento (opcional)
   - Alerta automática si tiene vencimiento

### Organización de Documentos

```
📁 Documentos/
├── 🚑 Vehículos/
│   ├── A-123-BC/
│   │   ├── Permiso Circulación.pdf
│   │   ├── ITV 2024.pdf
│   │   └── Seguro.pdf
│   └── B-456-DE/
│       └── [Documentos...]
├── 👥 Empleados/
│   ├── Juan García/
│   │   ├── DNI.pdf
│   │   ├── CV.pdf
│   │   └── Contrato.pdf
│   └── María López/
│       └── [Documentos...]
└── 🏢 Empresa/
    ├── Escrituras/
    ├── Certificados/
    └── Contratos/
```

### Búsqueda de Documentos

- **Por nombre** - Búsqueda parcial en nombres
- **Por categoría** - Filtrar por tipo de documento
- **Por fecha** - Rango de fechas de creación
- **Por vencimiento** - Documentos próximos a vencer

---

## Solución de Problemas

### Problemas de Acceso

**No puedo iniciar sesión:**
1. Verificar usuario y contraseña
2. Comprobar mayúsculas/minúsculas
3. Limpiar caché del navegador
4. Contactar al administrador

**Página no carga:**
1. Verificar conexión a internet
2. Comprobar que el servidor esté activo
3. Intentar con otro navegador
4. Verificar URL correcta

### Problemas con Documentos

**No puedo subir un archivo:**
1. Verificar tamaño (máx. 10MB)
2. Comprobar formato permitido
3. Asegurar conexión estable
4. Verificar permisos de escritura

**No veo un documento:**
1. Verificar permisos de usuario
2. Comprobar visibilidad del documento
3. Buscar en la categoría correcta
4. Contactar al administrador

### Problemas con Alertas

**No recibo alertas:**
1. Verificar configuración de notificaciones
2. Comprobar permisos de usuario
3. Verificar fecha del sistema
4. Revisar configuración de email

**Alerta incorrecta:**
1. Verificar fecha de vencimiento
2. Comprobar datos del vehículo/empleado
3. Actualizar información si es necesario
4. Marcar alerta como resuelta

### Atajos de Teclado

- `Ctrl + N` - Nuevo registro (vehículo/empleado)
- `Ctrl + F` - Buscar
- `Ctrl + S` - Guardar cambios
- `Esc` - Cancelar/Cerrar ventana
- `F5` - Actualizar página

### Recomendaciones de Uso

1. **Actualizar regularmente** - Mantenga la información actualizada
2. **Revisar alertas** - Atienda las notificaciones pendientes
3. **Backup de datos** - Exporte información importante
4. **Seguridad** - No comparta sus credenciales
5. **Formación** - Solicite capacitación para nuevas funciones

### Contacto de Soporte

Para problemas técnicos o consultas:
- Email: soporte@amiga-sistemas.com
- Teléfono: +34 900 123 456
- Horario: L-V 9:00-18:00

---

**© 2025 AMIGA - Aplicación de Manejo Integral de Gestión de Ambulancias**  
*Este manual es propiedad confidencial de la organización.*