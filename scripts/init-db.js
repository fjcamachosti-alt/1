const { sequelize, User, Vehicle, Alert, Document } = require('../models');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  try {
    console.log('🚀 Inicializando base de datos AMIGA...');
    
    // Sincronizar modelos
    await sequelize.sync({ force: true });
    console.log('✅ Modelos sincronizados');
    
    // Crear usuario administrador
    const adminPassword = await bcrypt.hash('apisistem', 10);
    const admin = await User.create({
      username: 'apisistem',
      email: 'admin@apisistem.com',
      password: adminPassword,
      firstName: 'Administrador',
      lastName: 'Sistema',
      role: 'admin',
      isActive: true,
      dni: '12345678A'
    });
    console.log('✅ Usuario administrador creado');
    
    // Crear vehículos de ejemplo
    const vehicles = await Vehicle.bulkCreate([
      {
        licensePlate: 'A-123-BC',
        brand: 'Mercedes-Benz',
        model: 'Sprinter 316 CDI',
        year: 2022,
        color: 'Blanco',
        vehicleType: 'ambulancia_tipo_A',
        fuelType: 'diesel',
        transmission: 'manual',
        mileage: 25000,
        status: 'available',
        acquisitionDate: '2022-03-15',
        acquisitionPrice: 45000.00,
        insuranceCompany: 'SegurAmbulancia S.A.',
        insurancePolicy: 'SA-2022-12345',
        insuranceExpiration: '2025-12-15',
        itvDate: '2024-01-20',
        itvExpiration: '2025-01-20',
        nextMaintenanceDate: '2024-12-01',
        nextMaintenanceMileage: 30000,
        location: 'Base Principal',
        garage: 'Garaje 1'
      },
      {
        licensePlate: 'B-456-DE',
        brand: 'Fiat',
        model: 'Ducato Maxi',
        year: 2021,
        color: 'Blanco',
        vehicleType: 'ambulancia_tipo_B',
        fuelType: 'diesel',
        transmission: 'manual',
        mileage: 35000,
        status: 'maintenance',
        acquisitionDate: '2021-06-10',
        acquisitionPrice: 38000.00,
        insuranceCompany: 'SegurAmbulancia S.A.',
        insurancePolicy: 'SA-2021-67890',
        insuranceExpiration: '2025-11-30',
        itvDate: '2024-02-15',
        itvExpiration: '2025-02-15',
        nextMaintenanceDate: '2024-11-15',
        nextMaintenanceMileage: 38000,
        location: 'Taller',
        garage: 'Taller Mecánico'
      },
      {
        licensePlate: 'C-789-FG',
        brand: 'Volkswagen',
        model: 'Crafter 35',
        year: 2023,
        color: 'Blanco',
        vehicleType: 'ambulancia_tipo_C',
        fuelType: 'diesel',
        transmission: 'automatic',
        mileage: 15000,
        status: 'available',
        acquisitionDate: '2023-01-20',
        acquisitionPrice: 52000.00,
        insuranceCompany: 'SegurAmbulancia S.A.',
        insurancePolicy: 'SA-2023-54321',
        insuranceExpiration: '2024-12-20',
        itvDate: '2024-03-10',
        itvExpiration: '2025-03-10',
        nextMaintenanceDate: '2025-01-10',
        nextMaintenanceMileage: 25000,
        location: 'Base Principal',
        garage: 'Garaje 2'
      }
    ]);
    console.log('✅ Vehículos de ejemplo creados');
    
    // Crear empleados de ejemplo
    const employees = await User.bulkCreate([
      {
        username: 'jgarcia',
        email: 'j.garcia@ambulancias.com',
        password: await bcrypt.hash('temp123', 10),
        firstName: 'Juan',
        lastName: 'García Pérez',
        role: 'tecnico',
        isActive: true,
        dni: '23456789B',
        phone: '600123456',
        position: 'Técnico Emergencias',
        department: 'Operaciones',
        hireDate: '2020-05-15',
        contractType: 'indefinido',
        workSchedule: 'completa'
      },
      {
        username: 'mlopez',
        email: 'm.lopez@ambulancias.com',
        password: await bcrypt.hash('temp123', 10),
        firstName: 'María',
        lastName: 'López Fernández',
        role: 'medico',
        isActive: true,
        dni: '34567890C',
        phone: '600234567',
        position: 'Médico de Urgencias',
        department: 'Servicios Médicos',
        hireDate: '2019-08-20',
        contractType: 'indefinido',
        workSchedule: 'rotativa'
      },
      {
        username: 'cruiz',
        email: 'c.ruiz@ambulancias.com',
        password: await bcrypt.hash('temp123', 10),
        firstName: 'Carlos',
        lastName: 'Ruiz Martínez',
        role: 'enfermero',
        isActive: true,
        dni: '45678901D',
        phone: '600345678',
        position: 'Enfermero Titulado',
        department: 'Servicios Médicos',
        hireDate: '2021-03-10',
        contractType: 'temporal',
        workSchedule: 'completa'
      }
    ]);
    console.log('✅ Empleados de ejemplo creados');
    
    // Crear alertas de ejemplo
    const today = new Date();
    const alerts = await Alert.bulkCreate([
      {
        title: 'ITV próxima - Ambulancia A-123',
        description: 'La ITV del vehículo A-123-BC vence el 20/01/2025',
        type: 'itv',
        entityType: 'vehicle',
        entityId: vehicles[0].id,
        priority: 'high',
        status: 'pending',
        dueDate: '2025-01-20',
        assignedTo: admin.id
      },
      {
        title: 'Seguro próximo a vencer - Ambulancia C-789',
        description: 'El seguro del vehículo C-789-FG vence el 20/12/2024',
        type: 'insurance',
        entityType: 'vehicle',
        entityId: vehicles[2].id,
        priority: 'urgent',
        status: 'pending',
        dueDate: '2024-12-20',
        assignedTo: admin.id
      },
      {
        title: 'Mantenimiento preventivo - Ambulancia B-456',
        description: 'Mantenimiento programado para el vehículo B-456-DE',
        type: 'maintenance',
        entityType: 'vehicle',
        entityId: vehicles[1].id,
        priority: 'medium',
        status: 'in_progress',
        dueDate: '2024-11-15',
        assignedTo: employees[0].id
      },
      {
        title: 'Contrato temporal próximo a vencer - Carlos Ruiz',
        description: 'El contrato de Carlos Ruiz vence el 10/03/2025',
        type: 'contract',
        entityType: 'user',
        entityId: employees[2].id,
        priority: 'high',
        status: 'pending',
        dueDate: '2025-03-10',
        assignedTo: admin.id
      }
    ]);
    console.log('✅ Alertas de ejemplo creadas');
    
    // Crear documentos de ejemplo
    const documents = await Document.bulkCreate([
      {
        name: 'Permiso de Circulación A-123',
        type: 'vehicle',
        category: 'Permiso Circulación',
        entityType: 'vehicle',
        entityId: vehicles[0].id,
        fileName: 'permiso_a123.pdf',
        originalName: 'permiso_circulacion.pdf',
        mimeType: 'application/pdf',
        size: 102400,
        path: '/uploads/documents/permiso_a123.pdf',
        isActive: true
      },
      {
        name: 'ITV Favorable A-123',
        type: 'vehicle',
        category: 'ITV',
        entityType: 'vehicle',
        entityId: vehicles[0].id,
        fileName: 'itv_a123.pdf',
        originalName: 'itv_favorable_2024.pdf',
        mimeType: 'application/pdf',
        size: 204800,
        path: '/uploads/documents/itv_a123.pdf',
        expirationDate: '2025-01-20',
        isActive: true
      },
      {
        name: 'DNI Juan García',
        type: 'user',
        category: 'DNI',
        entityType: 'user',
        entityId: employees[0].id,
        fileName: 'dni_jgarcia.pdf',
        originalName: 'dni_juan_garcia.pdf',
        mimeType: 'application/pdf',
        size: 153600,
        path: '/uploads/documents/dni_jgarcia.pdf',
        isActive: true
      }
    ]);
    console.log('✅ Documentos de ejemplo creados');
    
    console.log('\n🎉 Base de datos inicializada exitosamente!');
    console.log('\n📋 Resumen:');
    console.log(`   • Usuario administrador: apisistem / apisistem`);
    console.log(`   • Vehículos creados: ${vehicles.length}`);
    console.log(`   • Empleados creados: ${employees.length}`);
    console.log(`   • Alertas activas: ${alerts.length}`);
    console.log(`   • Documentos subidos: ${documents.length}`);
    
    console.log('\n🔑 Credenciales de usuarios de ejemplo:');
    console.log('   • jgarcia / temp123 (Técnico)');
    console.log('   • mlopez / temp123 (Médico)');
    console.log('   • cruiz / temp123 (Enfermero)');
    
    console.log('\n⚠️  IMPORTANTE: Cambie las contraseñas por defecto antes de usar en producción');
    
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };