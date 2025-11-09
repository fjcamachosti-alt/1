const express = require('express');
const { body, validationResult } = require('express-validator');
const { Alert, Vehicle, User } = require('../models');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

/**
 * @swagger
 * /api/alerts:
 *   get:
 *     summary: Obtener lista de alertas
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de alertas
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', priority = '', type = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    if (type) {
      whereClause.type = type;
    }

    // Si no es admin o gestor, solo mostrar alertas asignadas
    if (!['admin', 'gestor'].includes(req.user.role)) {
      whereClause.assignedTo = req.user.id;
    }

    const alerts = await Alert.findAndCountAll({
      where: whereClause,
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
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['firstName', 'lastName'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['dueDate', 'ASC']]
    });

    res.json({
      alerts: alerts.rows,
      total: alerts.count,
      page: parseInt(page),
      totalPages: Math.ceil(alerts.count / limit)
    });
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    res.status(500).json({ message: 'Error al obtener alertas' });
  }
});

/**
 * @swagger
 * /api/alerts/{id}:
 *   get:
 *     summary: Obtener alerta por ID
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alerta encontrada
 *       404:
 *         description: Alerta no encontrada
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const alert = await Alert.findByPk(req.params.id, {
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
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['firstName', 'lastName'],
          required: false
        }
      ]
    });

    if (!alert) {
      return res.status(404).json({ message: 'Alerta no encontrada' });
    }

    // Verificar permisos
    if (!['admin', 'gestor'].includes(req.user.role) && alert.assignedTo !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permisos para ver esta alerta' });
    }

    res.json(alert);
  } catch (error) {
    console.error('Error al obtener alerta:', error);
    res.status(500).json({ message: 'Error al obtener alerta' });
  }
});

/**
 * @swagger
 * /api/alerts:
 *   post:
 *     summary: Crear nueva alerta
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - type
 *               - entityType
 *               - entityId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *               entityType:
 *                 type: string
 *               entityId:
 *                 type: string
 *               priority:
 *                 type: string
 *               dueDate:
 *                 type: string
 *               assignedTo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Alerta creada exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/', [
  authMiddleware,
  roleMiddleware(['admin', 'gestor']),
  body('title').notEmpty().withMessage('El título es requerido'),
  body('description').notEmpty().withMessage('La descripción es requerida'),
  body('type').isIn(['itv', 'maintenance', 'insurance', 'document', 'contract', 'medical', 'other']).withMessage('Tipo inválido'),
  body('entityType').isIn(['vehicle', 'user', 'company', 'document']).withMessage('Tipo de entidad inválido'),
  body('entityId').notEmpty().withMessage('El ID de la entidad es requerido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const alert = await Alert.create({
      ...req.body,
      assignedTo: req.body.assignedTo || req.user.id
    });

    res.status(201).json({
      message: 'Alerta creada exitosamente',
      alert
    });
  } catch (error) {
    console.error('Error al crear alerta:', error);
    res.status(500).json({ message: 'Error al crear alerta' });
  }
});

/**
 * @swagger
 * /api/alerts/{id}:
 *   put:
 *     summary: Actualizar alerta
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Alerta actualizada
 *       404:
 *         description: Alerta no encontrada
 */
router.put('/:id', [
  authMiddleware,
  roleMiddleware(['admin', 'gestor'])
], async (req, res) => {
  try {
    const alert = await Alert.findByPk(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ message: 'Alerta no encontrada' });
    }

    await alert.update(req.body);

    res.json({
      message: 'Alerta actualizada exitosamente',
      alert
    });
  } catch (error) {
    console.error('Error al actualizar alerta:', error);
    res.status(500).json({ message: 'Error al actualizar alerta' });
  }
});

/**
 * @swagger
 * /api/alerts/{id}/resolve:
 *   put:
 *     summary: Resolver alerta
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Alerta resuelta
 *       404:
 *         description: Alerta no encontrada
 */
router.put('/:id/resolve', authMiddleware, async (req, res) => {
  try {
    const alert = await Alert.findByPk(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ message: 'Alerta no encontrada' });
    }

    // Verificar permisos
    if (!['admin', 'gestor'].includes(req.user.role) && alert.assignedTo !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permisos para resolver esta alerta' });
    }

    await alert.update({
      status: 'resolved',
      resolvedDate: new Date(),
      metadata: {
        ...alert.metadata,
        resolvedBy: req.user.id,
        notes: req.body.notes || ''
      }
    });

    res.json({
      message: 'Alerta resuelta exitosamente',
      alert
    });
  } catch (error) {
    console.error('Error al resolver alerta:', error);
    res.status(500).json({ message: 'Error al resolver alerta' });
  }
});

/**
 * @swagger
 * /api/alerts/{id}/assign:
 *   put:
 *     summary: Asignar alerta a usuario
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assignedTo
 *             properties:
 *               assignedTo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Alerta asignada
 *       404:
 *         description: Alerta no encontrada
 */
router.put('/:id/assign', [
  authMiddleware,
  roleMiddleware(['admin', 'gestor'])
], async (req, res) => {
  try {
    const alert = await Alert.findByPk(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ message: 'Alerta no encontrada' });
    }

    const { assignedTo } = req.body;

    // Verificar que el usuario existe
    const assignedUser = await User.findByPk(assignedTo);
    if (!assignedUser) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    await alert.update({ assignedTo });

    res.json({
      message: 'Alerta asignada exitosamente',
      alert
    });
  } catch (error) {
    console.error('Error al asignar alerta:', error);
    res.status(500).json({ message: 'Error al asignar alerta' });
  }
});

/**
 * @swagger
 * /api/alerts/upcoming:
 *   get:
 *     summary: Obtener alertas próximas a vencer
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Alertas próximas a vencer
 */
router.get('/upcoming', authMiddleware, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const upcomingAlerts = await Alert.findAll({
      where: {
        status: 'pending',
        dueDate: {
          [Op.between]: [today, futureDate]
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
      order: [['dueDate', 'ASC']]
    });

    res.json(upcomingAlerts);
  } catch (error) {
    console.error('Error al obtener alertas próximas:', error);
    res.status(500).json({ message: 'Error al obtener alertas próximas' });
  }
});

/**
 * @swagger
 * /api/alerts/bulk-resolve:
 *   post:
 *     summary: Resolver múltiples alertas
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - alertIds
 *             properties:
 *               alertIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Alertas resueltas
 *       400:
 *         description: Datos inválidos
 */
router.post('/bulk-resolve', [
  authMiddleware,
  roleMiddleware(['admin', 'gestor'])
], async (req, res) => {
  try {
    const { alertIds } = req.body;

    if (!Array.isArray(alertIds) || alertIds.length === 0) {
      return res.status(400).json({ message: 'Se requiere un array de IDs de alertas' });
    }

    const result = await Alert.update(
      {
        status: 'resolved',
        resolvedDate: new Date(),
        metadata: {
          resolvedBy: req.user.id
        }
      },
      {
        where: {
          id: {
            [Op.in]: alertIds
          }
        }
      }
    );

    res.json({
      message: `${result[0]} alertas resueltas exitosamente`,
      resolvedCount: result[0]
    });
  } catch (error) {
    console.error('Error al resolver alertas:', error);
    res.status(500).json({ message: 'Error al resolver alertas' });
  }
});

module.exports = router;