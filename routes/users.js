const express = require('express');
const { body, validationResult } = require('express-validator');
const { User, Document, Alert } = require('../models');
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
 * /api/users:
 *   get:
 *     summary: Obtener lista de usuarios/empleados
 *     tags: [Usuarios]
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
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de usuarios
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, role = '', search = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    if (role) {
      whereClause.role = role;
    }

    if (search) {
      whereClause[require('sequelize').Op.or] = [
        { firstName: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { lastName: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { dni: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { email: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }

    const users = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      users: users.rows,
      total: users.count,
      page: parseInt(page),
      totalPages: Math.ceil(users.count / limit)
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Usuarios]
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
 *         description: Usuario encontrado
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Document,
          as: 'Documents',
          where: { entityType: 'user' },
          required: false
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Crear nuevo usuario/empleado
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - dni
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               dni:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/', [
  authMiddleware,
  roleMiddleware(['admin', 'gestor']),
  body('username').isLength({ min: 3, max: 50 }).withMessage('El usuario debe tener entre 3 y 50 caracteres'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  body('firstName').notEmpty().withMessage('El nombre es requerido'),
  body('lastName').notEmpty().withMessage('El apellido es requerido'),
  body('dni').notEmpty().withMessage('El DNI es requerido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, firstName, secondName, lastName, secondLastName, dni, role } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { username },
          { email },
          { dni }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'El usuario, email o DNI ya existe' });
    }

    const user = await User.create({
      username,
      email,
      password,
      firstName,
      secondName,
      lastName,
      secondLastName,
      dni,
      role: role || 'oficina'
    });

    // Crear alerta para contrato si tiene fecha de vencimiento
    if (req.body.hireDate) {
      const contractEndDate = new Date(req.body.hireDate);
      contractEndDate.setFullYear(contractEndDate.getFullYear() + 1); // Asumir contrato de 1 año
      
      await Alert.create({
        title: `Contrato próximo a vencer - ${user.getFullName()}`,
        description: `El contrato de ${user.getFullName()} vence el ${contractEndDate.toISOString().split('T')[0]}`,
        type: 'contract',
        entityType: 'user',
        entityId: user.id,
        dueDate: contractEndDate,
        priority: 'high'
      });
    }

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        fullName: user.getFullName()
      }
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error al crear usuario' });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     tags: [Usuarios]
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
 *         description: Usuario actualizado
 *       404:
 *         description: Usuario no encontrado
 */
router.put('/:id', [
  authMiddleware,
  roleMiddleware(['admin', 'gestor'])
], async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // No permitir actualización de contraseña desde aquí
    const { password, ...updateData } = req.body;
    
    await user.update(updateData);

    res.json({
      message: 'Usuario actualizado exitosamente',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        fullName: user.getFullName()
      }
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
});

/**
 * @swagger
 * /api/users/{id}/documents:
 *   post:
 *     summary: Subir documento de empleado
 *     tags: [Usuarios]
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
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
    }

    const document = await Document.create({
      name: req.body.name || req.file.originalname,
      type: 'user',
      category: req.body.category,
      subcategory: req.body.subcategory,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      entityId: user.id,
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
 * /api/users/{id}/documents:
 *   get:
 *     summary: Obtener documentos de un empleado
 *     tags: [Usuarios]
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
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const documents = await Document.findAll({
      where: {
        entityType: 'user',
        entityId: user.id
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
 * /api/users/search:
 *   get:
 *     summary: Búsqueda avanzada de empleados
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: firstName
 *         schema:
 *           type: string
 *       - in: query
 *         name: lastName
 *         schema:
 *           type: string
 *       - in: query
 *         name: dni
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: position
 *         schema:
 *           type: string
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 */
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dni,
      role,
      position,
      department,
      page = 1,
      limit = 10
    } = req.query;

    const whereClause = {};

    if (firstName) {
      whereClause.firstName = { [require('sequelize').Op.iLike]: `%${firstName}%` };
    }

    if (lastName) {
      whereClause.lastName = { [require('sequelize').Op.iLike]: `%${lastName}%` };
    }

    if (dni) {
      whereClause.dni = { [require('sequelize').Op.iLike]: `%${dni}%` };
    }

    if (role) {
      whereClause.role = role;
    }

    if (position) {
      whereClause.position = { [require('sequelize').Op.iLike]: `%${position}%` };
    }

    if (department) {
      whereClause.department = { [require('sequelize').Op.iLike]: `%${department}%` };
    }

    const offset = (page - 1) * limit;

    const users = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      users: users.rows,
      total: users.count,
      page: parseInt(page),
      totalPages: Math.ceil(users.count / limit)
    });
  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({ message: 'Error en la búsqueda' });
  }
});

module.exports = router;