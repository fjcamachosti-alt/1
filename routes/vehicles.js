const express = require('express');
const { body, validationResult } = require('express-validator');
const { Vehicle, Document, Alert } = require('../models');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/documents');
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
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen y PDF'));
    }
  }
});

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: Obtener lista de vehículos
 *     tags: [Vehículos]
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de vehículos
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    if (search) {
      whereClause[require('sequelize').Op.or] = [
        { licensePlate: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { brand: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { model: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    const vehicles = await Vehicle.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      vehicles: vehicles.rows,
      total: vehicles.count,
      page: parseInt(page),
      totalPages: Math.ceil(vehicles.count / limit)
    });
  } catch (error) {
    console.error('Error al obtener vehículos:', error);
    res.status(500).json({ message: 'Error al obtener vehículos' });
  }
});

/**
 * @swagger
 * /api/vehicles/{id}:
 *   get:
 *     summary: Obtener vehículo por ID
 *     tags: [Vehículos]
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
 *         description: Vehículo encontrado
 *       404:
 *         description: Vehículo no encontrado
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id, {
      include: [
        {
          model: Document,
          as: 'Documents',
          where: { entityType: 'vehicle' },
          required: false
        }
      ]
    });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }

    res.json(vehicle);
  } catch (error) {
    console.error('Error al obtener vehículo:', error);
    res.status(500).json({ message: 'Error al obtener vehículo' });
  }
});

/**
 * @swagger
 * /api/vehicles:
 *   post:
 *     summary: Crear nuevo vehículo
 *     tags: [Vehículos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - licensePlate
 *               - brand
 *               - model
 *               - year
 *     responses:
 *       201:
 *         description: Vehículo creado exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/', [
  authMiddleware,
  roleMiddleware(['admin', 'gestor']),
  body('licensePlate').notEmpty().withMessage('La matrícula es requerida'),
  body('brand').notEmpty().withMessage('La marca es requerida'),
  body('model').notEmpty().withMessage('El modelo es requerido'),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Año inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const vehicle = await Vehicle.create(req.body);

    // Crear alertas automáticas si hay fechas de vencimiento
    if (req.body.itvExpiration) {
      await Alert.create({
        title: `ITV próxima - ${vehicle.licensePlate}`,
        description: `La ITV del vehículo ${vehicle.licensePlate} vence el ${req.body.itvExpiration}`,
        type: 'itv',
        entityType: 'vehicle',
        entityId: vehicle.id,
        dueDate: req.body.itvExpiration,
        priority: 'high'
      });
    }

    if (req.body.insuranceExpiration) {
      await Alert.create({
        title: `Seguro próximo a vencer - ${vehicle.licensePlate}`,
        description: `El seguro del vehículo ${vehicle.licensePlate} vence el ${req.body.insuranceExpiration}`,
        type: 'insurance',
        entityType: 'vehicle',
        entityId: vehicle.id,
        dueDate: req.body.insuranceExpiration,
        priority: 'urgent'
      });
    }

    res.status(201).json({
      message: 'Vehículo creado exitosamente',
      vehicle
    });
  } catch (error) {
    console.error('Error al crear vehículo:', error);
    res.status(500).json({ message: 'Error al crear vehículo' });
  }
});

/**
 * @swagger
 * /api/vehicles/{id}:
 *   put:
 *     summary: Actualizar vehículo
 *     tags: [Vehículos]
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
 *         description: Vehículo actualizado
 *       404:
 *         description: Vehículo no encontrado
 */
router.put('/:id', [
  authMiddleware,
  roleMiddleware(['admin', 'gestor'])
], async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }

    await vehicle.update(req.body);

    // Actualizar alertas si las fechas cambiaron
    if (req.body.itvExpiration || req.body.insuranceExpiration) {
      // Actualizar alertas existentes o crear nuevas
      // Lógica para actualizar alertas...
    }

    res.json({
      message: 'Vehículo actualizado exitosamente',
      vehicle
    });
  } catch (error) {
    console.error('Error al actualizar vehículo:', error);
    res.status(500).json({ message: 'Error al actualizar vehículo' });
  }
});

/**
 * @swagger
 * /api/vehicles/{id}/documents:
 *   post:
 *     summary: Subir documento de vehículo
 *     tags: [Vehículos]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Documento subido exitosamente
 */
router.post('/:id/documents', [
  authMiddleware,
  roleMiddleware(['admin', 'gestor']),
  upload.single('document')
], async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
    }

    const document = await Document.create({
      name: req.body.name || req.file.originalname,
      type: 'vehicle',
      category: req.body.category,
      subcategory: req.body.subcategory,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      entityId: vehicle.id,
      expirationDate: req.body.expirationDate,
      issueDate: req.body.issueDate,
      issuingAuthority: req.body.issuingAuthority,
      documentNumber: req.body.documentNumber,
      description: req.body.description
    });

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
 * /api/vehicles/{id}/documents:
 *   get:
 *     summary: Obtener documentos de un vehículo
 *     tags: [Vehículos]
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
 *         description: Lista de documentos
 */
router.get('/:id/documents', authMiddleware, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }

    const documents = await Document.findAll({
      where: {
        entityType: 'vehicle',
        entityId: vehicle.id
      },
      order: [['createdAt', 'DESC']]
    });

    res.json(documents);
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    res.status(500).json({ message: 'Error al obtener documentos' });
  }
});

/**
 * @swagger
 * /api/vehicles/alerts:
 *   get:
 *     summary: Obtener alertas de vehículos
 *     tags: [Vehículos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de alertas
 */
router.get('/alerts', authMiddleware, async (req, res) => {
  try {
    const alerts = await Alert.findAll({
      where: {
        entityType: 'vehicle',
        status: 'pending'
      },
      include: [
        {
          model: Vehicle,
          attributes: ['licensePlate', 'brand', 'model']
        }
      ],
      order: [['dueDate', 'ASC']]
    });

    res.json(alerts);
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    res.status(500).json({ message: 'Error al obtener alertas' });
  }
});

/**
 * @swagger
 * /api/vehicles/search:
 *   get:
 *     summary: Búsqueda avanzada de vehículos
 *     tags: [Vehículos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: licensePlate
 *         schema:
 *           type: string
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: yearFrom
 *         schema:
 *           type: integer
 *       - in: query
 *         name: yearTo
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 */
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const {
      licensePlate,
      brand,
      model,
      status,
      yearFrom,
      yearTo,
      page = 1,
      limit = 10
    } = req.query;

    const whereClause = {};

    if (licensePlate) {
      whereClause.licensePlate = { [require('sequelize').Op.iLike]: `%${licensePlate}%` };
    }

    if (brand) {
      whereClause.brand = { [require('sequelize').Op.iLike]: `%${brand}%` };
    }

    if (model) {
      whereClause.model = { [require('sequelize').Op.iLike]: `%${model}%` };
    }

    if (status) {
      whereClause.status = status;
    }

    if (yearFrom || yearTo) {
      whereClause.year = {};
      if (yearFrom) whereClause.year[require('sequelize').Op.gte] = parseInt(yearFrom);
      if (yearTo) whereClause.year[require('sequelize').Op.lte] = parseInt(yearTo);
    }

    const offset = (page - 1) * limit;

    const vehicles = await Vehicle.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      vehicles: vehicles.rows,
      total: vehicles.count,
      page: parseInt(page),
      totalPages: Math.ceil(vehicles.count / limit)
    });
  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({ message: 'Error en la búsqueda' });
  }
});

module.exports = router;