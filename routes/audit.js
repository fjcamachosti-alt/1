const express = require('express');
const { body, validationResult } = require('express-validator');
const AuditLog = require('../models/AuditLog');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

/**
 * @swagger
 * /api/audit/logs:
 *   get:
 *     summary: Obtener registros de auditoría
 *     tags: [Auditoría]
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
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de registros de auditoría
 */
router.get('/logs', [
  authMiddleware,
  roleMiddleware(['admin', 'gestor'])
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId = '',
      action = '',
      entityType = '',
      dateFrom = '',
      dateTo = ''
    } = req.query;

    const offset = (page - 1) * limit;

    const whereClause = {};

    if (userId) {
      whereClause.userId = userId;
    }

    if (action) {
      whereClause.action = action;
    }

    if (entityType) {
      whereClause.entityType = entityType;
    }

    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt[Op.gte] = new Date(dateFrom);
      if (dateTo) whereClause.createdAt[Op.lte] = new Date(dateTo);
    }

    const logs = await AuditLog.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      logs: logs.rows,
      total: logs.count,
      page: parseInt(page),
      totalPages: Math.ceil(logs.count / limit)
    });
  } catch (error) {
    console.error('Error al obtener registros de auditoría:', error);
    res.status(500).json({ message: 'Error al obtener registros de auditoría' });
  }
});

/**
 * @swagger
 * /api/audit/logs/{id}:
 *   get:
 *     summary: Obtener registro de auditoría por ID
 *     tags: [Auditoría]
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
 *         description: Registro de auditoría encontrado
 *       404:
 *         description: Registro no encontrado
 */
router.get('/logs/:id', [
  authMiddleware,
  roleMiddleware(['admin', 'gestor'])
], async (req, res) => {
  try {
    const log = await AuditLog.findByPk(req.params.id);

    if (!log) {
      return res.status(404).json({ message: 'Registro de auditoría no encontrado' });
    }

    res.json(log);
  } catch (error) {
    console.error('Error al obtener registro de auditoría:', error);
    res.status(500).json({ message: 'Error al obtener registro de auditoría' });
  }
});

/**
 * @swagger
 * /api/audit/user-activity/{userId}:
 *   get:
 *     summary: Obtener actividad de un usuario específico
 *     tags: [Auditoría]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Actividad del usuario
 */
router.get('/user-activity/:userId', [
  authMiddleware,
  roleMiddleware(['admin', 'gestor'])
], async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const logs = await AuditLog.findAndCountAll({
      where: { userId: req.params.userId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      logs: logs.rows,
      total: logs.count,
      page: parseInt(page),
      totalPages: Math.ceil(logs.count / limit)
    });
  } catch (error) {
    console.error('Error al obtener actividad del usuario:', error);
    res.status(500).json({ message: 'Error al obtener actividad del usuario' });
  }
});

/**
 * @swagger
 * /api/audit/entity-activity/{entityType}/{entityId}:
 *   get:
 *     summary: Obtener actividad de una entidad específica
 *     tags: [Auditoría]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Actividad de la entidad
 */
router.get('/entity-activity/:entityType/:entityId', [
  authMiddleware,
  roleMiddleware(['admin', 'gestor'])
], async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const logs = await AuditLog.findAndCountAll({
      where: {
        entityType,
        entityId
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      logs: logs.rows,
      total: logs.count,
      page: parseInt(page),
      totalPages: Math.ceil(logs.count / limit)
    });
  } catch (error) {
    console.error('Error al obtener actividad de la entidad:', error);
    res.status(500).json({ message: 'Error al obtener actividad de la entidad' });
  }
});

/**
 * @swagger
 * /api/audit/statistics:
 *   get:
 *     summary: Obtener estadísticas de auditoría
 *     tags: [Auditoría]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estadísticas de auditoría
 */
router.get('/statistics', [
  authMiddleware,
  roleMiddleware(['admin', 'gestor'])
], async (req, res) => {
  try {
    const { dateFrom = '', dateTo = '' } = req.query;

    const whereClause = {};

    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt[Op.gte] = new Date(dateFrom);
      if (dateTo) whereClause.createdAt[Op.lte] = new Date(dateTo);
    }

    // Acciones más comunes
    const topActions = await AuditLog.findAll({
      where: whereClause,
      attributes: ['action', [require('sequelize').fn('COUNT', 'id'), 'count']],
      group: ['action'],
      order: [[require('sequelize').fn('COUNT', 'id'), 'DESC']],
      limit: 10
    });

    // Usuarios más activos
    const topUsers = await AuditLog.findAll({
      where: whereClause,
      attributes: ['userName', [require('sequelize').fn('COUNT', 'id'), 'count']],
      group: ['userName'],
      order: [[require('sequelize').fn('COUNT', 'id'), 'DESC']],
      limit: 10
    });

    // Actividad por entidad
    const entityActivity = await AuditLog.findAll({
      where: whereClause,
      attributes: ['entityType', [require('sequelize').fn('COUNT', 'id'), 'count']],
      group: ['entityType'],
      order: [[require('sequelize').fn('COUNT', 'id'), 'DESC']]
    });

    // Errores por día
    const errorsByDay = await AuditLog.findAll({
      where: {
        ...whereClause,
        success: false
      },
      attributes: [
        [require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'date'],
        [require('sequelize').fn('COUNT', 'id'), 'count']
      ],
      group: [require('sequelize').fn('DATE', require('sequelize').col('createdAt'))],
      order: [[require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'DESC']],
      limit: 30
    });

    // Total registros
    const totalLogs = await AuditLog.count({ where: whereClause });

    // Registros exitosos y fallidos
    const successfulLogs = await AuditLog.count({
      where: { ...whereClause, success: true }
    });

    const failedLogs = await AuditLog.count({
      where: { ...whereClause, success: false }
    });

    res.json({
      totalLogs,
      successfulLogs,
      failedLogs,
      topActions: topActions.map(item => ({
        action: item.action,
        count: parseInt(item.dataValues.count)
      })),
      topUsers: topUsers.map(item => ({
        userName: item.userName,
        count: parseInt(item.dataValues.count)
      })),
      entityActivity: entityActivity.map(item => ({
        entityType: item.entityType,
        count: parseInt(item.dataValues.count)
      })),
      errorsByDay: errorsByDay.map(item => ({
        date: item.dataValues.date,
        count: parseInt(item.dataValues.count)
      }))
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
});

/**
 * @swagger
 * /api/audit/export:
 *   get:
 *     summary: Exportar registros de auditoría
 *     tags: [Auditoría]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, json]
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Archivo exportado
 */
router.get('/export', [
  authMiddleware,
  roleMiddleware(['admin'])
], async (req, res) => {
  try {
    const { format = 'json', dateFrom = '', dateTo = '' } = req.query;

    const whereClause = {};

    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt[Op.gte] = new Date(dateFrom);
      if (dateTo) whereClause.createdAt[Op.lte] = new Date(dateTo);
    }

    const logs = await AuditLog.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    if (format === 'csv') {
      const csv = convertToCSV(logs);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="audit_logs.csv"');
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="audit_logs.json"');
      res.json(logs);
    }
  } catch (error) {
    console.error('Error al exportar registros:', error);
    res.status(500).json({ message: 'Error al exportar registros' });
  }
});

// Función auxiliar para convertir a CSV
function convertToCSV(logs) {
  const headers = [
    'ID',
    'Usuario',
    'Rol',
    'Acción',
    'Tipo Entidad',
    'ID Entidad',
    'Nombre Entidad',
    'Método',
    'URL',
    'IP',
    'Éxito',
    'Mensaje Error',
    'Duración (ms)',
    'Fecha'
  ];

  const csvContent = [
    headers.join(','),
    ...logs.map(log => [
      log.id,
      `"${log.userName || ''}"`,
      log.userRole || '',
      log.action,
      log.entityType,
      log.entityId || '',
      `"${log.entityName || ''}"`,
      log.method || '',
      `"${log.url || ''}"`,
      log.ipAddress || '',
      log.success,
      `"${log.errorMessage || ''}"`,
      log.duration || '',
      log.createdAt.toISOString()
    ].join(','))
  ].join('\n');

  return csvContent;
}

module.exports = router;