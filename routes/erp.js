const express = require('express');
const { body, validationResult } = require('express-validator');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { Document, Alert } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/erp');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen, PDF y documentos de Office'));
    }
  }
});

/**
 * @swagger
 * /api/erp/documents:
 *   get:
 *     summary: Obtener documentos empresariales
 *     tags: [ERP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
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
 *         description: Lista de documentos empresariales
 */
router.get('/documents', authMiddleware, async (req, res) => {
  try {
    const { category = '', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      entityType: 'company'
    };

    if (category) {
      whereClause.category = category;
    }

    const documents = await Document.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      documents: documents.rows,
      total: documents.count,
      page: parseInt(page),
      totalPages: Math.ceil(documents.count / limit)
    });
  } catch (error) {
    console.error('Error al obtener documentos empresariales:', error);
    res.status(500).json({ message: 'Error al obtener documentos empresariales' });
  }
});

/**
 * @swagger
 * /api/erp/documents:
 *   post:
 *     summary: Subir documento empresarial
 *     tags: [ERP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *               category:
 *                 type: string
 *               subcategory:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               expirationDate:
 *                 type: string
 *     responses:
 *       201:
 *         description: Documento subido exitosamente
 */
router.post('/documents', [
  authMiddleware,
  roleMiddleware(['admin', 'gestor']),
  upload.single('document')
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
    }

    const document = await Document.create({
      name: req.body.name || req.file.originalname,
      type: 'company',
      category: req.body.category,
      subcategory: req.body.subcategory,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      entityId: null, // Documentos empresariales no están asociados a una entidad específica
      expirationDate: req.body.expirationDate,
      issueDate: req.body.issueDate,
      issuingAuthority: req.body.issuingAuthority,
      documentNumber: req.body.documentNumber,
      description: req.body.description
    });

    // Crear alerta si tiene fecha de vencimiento
    if (req.body.expirationDate) {
      await Alert.create({
        title: `Documento empresarial próximo a vencer - ${document.name}`,
        description: `El documento ${document.name} vence el ${req.body.expirationDate}`,
        type: 'document',
        entityType: 'company',
        entityId: document.id,
        dueDate: req.body.expirationDate,
        priority: 'medium'
      });
    }

    res.status(201).json({
      message: 'Documento subido exitosamente',
      document
    });
  } catch (error) {
    console.error('Error al subir documento:', error);
    res.status(500).json({ message: 'Error al subir documento' });
  }
});

/**
 * @swagger
 * /api/erp/categories:
 *   get:
 *     summary: Obtener categorías de documentos empresariales
 *     tags: [ERP]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categorías disponibles
 */
router.get('/categories', authMiddleware, async (req, res) => {
  try {
    const categories = [
      {
        name: 'Escrituras',
        subcategories: ['Constitución', 'Modificación', 'Otros']
      },
      {
        name: 'Certificados',
        subcategories: ['Calidad', 'Solvencia', 'Liquidez', 'Otros']
      },
      {
        name: 'Contratos',
        subcategories: ['Trabajadores', 'Clientes', 'Proveedores', 'Servicios', 'Otros']
      },
      {
        name: 'Documentos Bancarios',
        subcategories: ['Créditos', 'Préstamos', 'Hipotecas', 'Otros']
      },
      {
        name: 'AEAT',
        subcategories: ['Declaraciones', 'Impuestos', 'Otros']
      },
      {
        name: 'Seguridad Social',
        subcategories: ['Cuotas', 'Pagos', 'Otros']
      },
      {
        name: 'Clientes',
        subcategories: ['Contratos', 'Facturas', 'Otros']
      },
      {
        name: 'Proveedores',
        subcategories: ['Contratos', 'Facturas', 'Otros']
      },
      {
        name: 'Facturas Emitidas',
        subcategories: ['Mensual', 'Trimestral', 'Anual', 'Otros']
      },
      {
        name: 'Facturas Recibidas',
        subcategories: ['Mensual', 'Trimestral', 'Anual', 'Otros']
      }
    ];

    res.json(categories);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ message: 'Error al obtener categorías' });
  }
});

/**
 * @swagger
 * /api/erp/expiring-documents:
 *   get:
 *     summary: Obtener documentos empresariales próximos a vencer
 *     tags: [ERP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Documentos próximos a vencer
 */
router.get('/expiring-documents', authMiddleware, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const expiringDocuments = await Document.findAll({
      where: {
        entityType: 'company',
        expirationDate: {
          [Op.between]: [today, futureDate]
        },
        isActive: true
      },
      order: [['expirationDate', 'ASC']]
    });

    res.json(expiringDocuments);
  } catch (error) {
    console.error('Error al obtener documentos próximos a vencer:', error);
    res.status(500).json({ message: 'Error al obtener documentos próximos a vencer' });
  }
});

/**
 * @swagger
 * /api/erp/search:
 *   get:
 *     summary: Buscar documentos empresariales
 *     tags: [ERP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
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
 *         description: Resultados de búsqueda
 */
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { query = '', category = '', dateFrom = '', dateTo = '', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      entityType: 'company'
    };

    if (query) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${query}%` } },
        { description: { [Op.iLike]: `%${query}%` } },
        { documentNumber: { [Op.iLike]: `%${query}%` } }
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt[Op.gte] = new Date(dateFrom);
      if (dateTo) whereClause.createdAt[Op.lte] = new Date(dateTo);
    }

    const documents = await Document.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      documents: documents.rows,
      total: documents.count,
      page: parseInt(page),
      totalPages: Math.ceil(documents.count / limit)
    });
  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({ message: 'Error en la búsqueda' });
  }
});

/**
 * @swagger
 * /api/erp/statistics:
 *   get:
 *     summary: Obtener estadísticas empresariales
 *     tags: [ERP]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas empresariales
 */
router.get('/statistics', authMiddleware, async (req, res) => {
  try {
    // Documentos por categoría
    const documentsByCategory = await Document.findAll({
      where: { entityType: 'company' },
      attributes: ['category', [require('sequelize').fn('COUNT', 'id'), 'count']],
      group: ['category']
    });

    // Documentos próximos a vencer
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringDocuments = await Document.count({
      where: {
        entityType: 'company',
        expirationDate: {
          [Op.between]: [today, thirtyDaysFromNow]
        },
        isActive: true
      }
    });

    // Documentos vencidos
    const expiredDocuments = await Document.count({
      where: {
        entityType: 'company',
        expirationDate: {
          [Op.lt]: today
        },
        isActive: true
      }
    });

    // Total de documentos
    const totalDocuments = await Document.count({
      where: { entityType: 'company' }
    });

    res.json({
      totalDocuments,
      documentsByCategory: documentsByCategory.reduce((acc, stat) => {
        acc[stat.category] = parseInt(stat.dataValues.count);
        return acc;
      }, {}),
      expiringDocuments,
      expiredDocuments
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
});

/**
 * @swagger
 * /api/erp/documents/{id}:
 *   delete:
 *     summary: Eliminar documento empresarial
 *     tags: [ERP]
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
 *         description: Documento eliminado
 *       404:
 *         description: Documento no encontrado
 */
router.delete('/documents/:id', [
  authMiddleware,
  roleMiddleware(['admin', 'gestor'])
], async (req, res) => {
  try {
    const document = await Document.findOne({
      where: {
        id: req.params.id,
        entityType: 'company'
      }
    });

    if (!document) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    // Eliminar archivo físico
    if (fs.existsSync(document.path)) {
      fs.unlinkSync(document.path);
    }

    await document.destroy();

    res.json({ message: 'Documento eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    res.status(500).json({ message: 'Error al eliminar documento' });
  }
});

module.exports = router;