const express = require('express');
const { User, Vehicle, Alert, Document } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Obtener estadísticas del dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas del dashboard
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // Contar vehículos por estado
    const vehicleStats = await Vehicle.findAll({
      attributes: ['status', [require('sequelize').fn('COUNT', 'id'), 'count']],
      group: ['status']
    });

    // Contar empleados por rol
    const userStats = await User.findAll({
      attributes: ['role', [require('sequelize').fn('COUNT', 'id'), 'count']],
      group: ['role']
    });

    // Contar alertas por prioridad
    const alertStats = await Alert.findAll({
      attributes: ['priority', [require('sequelize').fn('COUNT', 'id'), 'count']],
      where: { status: 'pending' },
      group: ['priority']
    });

    // Documentos próximos a vencer (en los próximos 30 días)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringDocuments = await Document.count({
      where: {
        expirationDate: {
          [Op.between]: [new Date(), thirtyDaysFromNow]
        },
        isActive: true
      }
    });

    // Vehículos con mantenimiento próximo
    const upcomingMaintenance = await Vehicle.count({
      where: {
        nextMaintenanceDate: {
          [Op.between]: [new Date(), thirtyDaysFromNow]
        }
      }
    });

    res.json({
      vehicles: {
        total: await Vehicle.count(),
        byStatus: vehicleStats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.dataValues.count);
          return acc;
        }, {})
      },
      users: {
        total: await User.count({ where: { isActive: true } }),
        byRole: userStats.reduce((acc, stat) => {
          acc[stat.role] = parseInt(stat.dataValues.count);
          return acc;
        }, {})
      },
      alerts: {
        total: await Alert.count({ where: { status: 'pending' } }),
        byPriority: alertStats.reduce((acc, stat) => {
          acc[stat.priority] = parseInt(stat.dataValues.count);
          return acc;
        }, {})
      },
      expiringDocuments,
      upcomingMaintenance
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
});

/**
 * @swagger
 * /api/dashboard/recent-activity:
 *   get:
 *     summary: Obtener actividad reciente
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Actividad reciente
 */
router.get('/recent-activity', authMiddleware, async (req, res) => {
  try {
    const limit = 10;

    // Obtener vehículos creados recientemente
    const recentVehicles = await Vehicle.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'licensePlate', 'brand', 'model', 'createdAt']
    });

    // Obtener usuarios creados recientemente
    const recentUsers = await User.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'firstName', 'lastName', 'role', 'createdAt']
    });

    // Obtener alertas recientes
    const recentAlerts = await Alert.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Vehicle,
          attributes: ['licensePlate'],
          required: false
        },
        {
          model: User,
          attributes: ['firstName', 'lastName'],
          required: false
        }
      ]
    });

    // Obtener documentos subidos recientemente
    const recentDocuments = await Document.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'type', 'category', 'createdAt']
    });

    res.json({
      recentVehicles,
      recentUsers,
      recentAlerts,
      recentDocuments
    });
  } catch (error) {
    console.error('Error al obtener actividad reciente:', error);
    res.status(500).json({ message: 'Error al obtener actividad reciente' });
  }
});

/**
 * @swagger
 * /api/dashboard/pending-alerts:
 *   get:
 *     summary: Obtener alertas pendientes
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alertas pendientes
 */
router.get('/pending-alerts', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Alertas próximas a vencer
    const pendingAlerts = await Alert.findAll({
      where: {
        status: 'pending',
        dueDate: {
          [Op.between]: [today, thirtyDaysFromNow]
        }
      },
      include: [
        {
          model: Vehicle,
          attributes: ['licensePlate', 'brand', 'model'],
          required: false
        },
        {
          model: User,
          attributes: ['firstName', 'lastName'],
          required: false
        }
      ],
      order: [['dueDate', 'ASC']],
      limit: 10
    });

    res.json(pendingAlerts);
  } catch (error) {
    console.error('Error al obtener alertas pendientes:', error);
    res.status(500).json({ message: 'Error al obtener alertas pendientes' });
  }
});

/**
 * @swagger
 * /api/dashboard/expiring-documents:
 *   get:
 *     summary: Obtener documentos próximos a vencer
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Documentos próximos a vencer
 */
router.get('/expiring-documents', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringDocuments = await Document.findAll({
      where: {
        expirationDate: {
          [Op.between]: [today, thirtyDaysFromNow]
        },
        isActive: true
      },
      include: [
        {
          model: Vehicle,
          attributes: ['licensePlate', 'brand', 'model'],
          required: false
        },
        {
          model: User,
          attributes: ['firstName', 'lastName'],
          required: false
        }
      ],
      order: [['expirationDate', 'ASC']],
      limit: 10
    });

    res.json(expiringDocuments);
  } catch (error) {
    console.error('Error al obtener documentos próximos a vencer:', error);
    res.status(500).json({ message: 'Error al obtener documentos próximos a vencer' });
  }
});

/**
 * @swagger
 * /api/dashboard/maintenance-schedule:
 *   get:
 *     summary: Obtener calendario de mantenimiento
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Calendario de mantenimiento
 */
router.get('/maintenance-schedule', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    const fifteenDaysFromNow = new Date();
    fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);

    const maintenanceSchedule = await Vehicle.findAll({
      where: {
        nextMaintenanceDate: {
          [Op.between]: [today, fifteenDaysFromNow]
        }
      },
      attributes: ['id', 'licensePlate', 'brand', 'model', 'nextMaintenanceDate', 'nextMaintenanceMileage'],
      order: [['nextMaintenanceDate', 'ASC']]
    });

    res.json(maintenanceSchedule);
  } catch (error) {
    console.error('Error al obtener calendario de mantenimiento:', error);
    res.status(500).json({ message: 'Error al obtener calendario de mantenimiento' });
  }
});

/**
 * @swagger
 * /api/dashboard/quick-actions:
 *   get:
 *     summary: Obtener acciones rápidas disponibles
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Acciones rápidas disponibles
 */
router.get('/quick-actions', authMiddleware, async (req, res) => {
  try {
    const userRole = req.user.role;
    
    // Definir acciones rápidas según el rol del usuario
    const actions = {
      admin: [
        { name: 'Nuevo Vehículo', icon: 'fas fa-ambulance', action: 'new-vehicle', path: '/vehicles/new' },
        { name: 'Nuevo Empleado', icon: 'fas fa-user-plus', action: 'new-user', path: '/users/new' },
        { name: 'Generar Reporte', icon: 'fas fa-file-alt', action: 'generate-report', path: '/reports' },
        { name: 'Configuración', icon: 'fas fa-cog', action: 'settings', path: '/settings' }
      ],
      gestor: [
        { name: 'Nuevo Vehículo', icon: 'fas fa-ambulance', action: 'new-vehicle', path: '/vehicles/new' },
        { name: 'Nuevo Empleado', icon: 'fas fa-user-plus', action: 'new-user', path: '/users/new' },
        { name: 'Programar Mantenimiento', icon: 'fas fa-calendar-plus', action: 'schedule-maintenance', path: '/maintenance/schedule' },
        { name: 'Generar Reporte', icon: 'fas fa-file-alt', action: 'generate-report', path: '/reports' }
      ],
      oficina: [
        { name: 'Buscar Vehículo', icon: 'fas fa-search', action: 'search-vehicle', path: '/vehicles/search' },
        { name: 'Buscar Empleado', icon: 'fas fa-search', action: 'search-user', path: '/users/search' },
        { name: 'Ver Documentos', icon: 'fas fa-folder', action: 'view-documents', path: '/documents' }
      ],
      tecnico: [
        { name: 'Mis Vehículos', icon: 'fas fa-ambulance', action: 'my-vehicles', path: '/vehicles/assigned' },
        { name: 'Checklist Diario', icon: 'fas fa-clipboard-check', action: 'daily-checklist', path: '/checklist' },
        { name: 'Reportar Incidencia', icon: 'fas fa-exclamation-triangle', action: 'report-incident', path: '/incidents/new' }
      ],
      medico: [
        { name: 'Mis Pacientes', icon: 'fas fa-user-injured', action: 'my-patients', path: '/patients' },
        { name: 'Inventario Médico', icon: 'fas fa-medkit', action: 'medical-inventory', path: '/inventory/medical' },
        { name: 'Checklist Médico', icon: 'fas fa-clipboard-check', action: 'medical-checklist', path: '/checklist/medical' }
      ],
      enfermero: [
        { name: 'Inventario Médico', icon: 'fas fa-medkit', action: 'medical-inventory', path: '/inventory/medical' },
        { name: 'Checklist Médico', icon: 'fas fa-clipboard-check', action: 'medical-checklist', path: '/checklist/medical' },
        { name: 'Registro de Pacientes', icon: 'fas fa-user-injured', action: 'patient-records', path: '/patients/records' }
      ]
    };

    res.json({
      actions: actions[userRole] || actions.oficina
    });
  } catch (error) {
    console.error('Error al obtener acciones rápidas:', error);
    res.status(500).json({ message: 'Error al obtener acciones rápidas' });
  }
});

/**
 * @swagger
 * /api/dashboard/notifications:
 *   get:
 *     summary: Obtener notificaciones del usuario
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notificaciones del usuario
 */
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Obtener alertas asignadas al usuario
    const assignedAlerts = await Alert.findAll({
      where: {
        assignedTo: userId,
        status: 'pending'
      },
      include: [
        {
          model: Vehicle,
          attributes: ['licensePlate', 'brand', 'model'],
          required: false
        },
        {
          model: User,
          attributes: ['firstName', 'lastName'],
          required: false
        }
      ],
      order: [['dueDate', 'ASC']],
      limit: 5
    });

    // Obtener alertas generales según el rol
    let generalAlerts = [];
    if (['admin', 'gestor'].includes(userRole)) {
      generalAlerts = await Alert.findAll({
        where: {
          status: 'pending',
          priority: {
            [Op.in]: ['high', 'urgent']
          }
        },
        include: [
          {
            model: Vehicle,
            attributes: ['licensePlate', 'brand', 'model'],
            required: false
          }
        ],
        order: [['dueDate', 'ASC']],
        limit: 5
      });
    }

    res.json({
      assignedAlerts,
      generalAlerts
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ message: 'Error al obtener notificaciones' });
  }
});

module.exports = router;