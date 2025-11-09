const AuditLog = require('../models/AuditLog');

const auditMiddleware = async (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;
  const originalJson = res.json;

  let responseBody = null;
  let responseStatusCode = null;

  // Interceptar res.send
  res.send = function(body) {
    responseBody = body;
    responseStatusCode = res.statusCode;
    return originalSend.call(this, body);
  };

  // Interceptar res.json
  res.json = function(body) {
    responseBody = body;
    responseStatusCode = res.statusCode;
    return originalJson.call(this, body);
  };

  res.on('finish', async () => {
    try {
      const duration = Date.now() - startTime;
      
      // Determinar la acción basada en el método y ruta
      const action = determineAction(req.method, req.route?.path || req.path);
      
      // Determinar el tipo de entidad
      const entityType = determineEntityType(req.path);

      // Crear registro de auditoría
      await AuditLog.create({
        userId: req.user?.id || null,
        userName: req.user?.getFullName?.() || req.user?.username || 'Anonymous',
        userRole: req.user?.role || null,
        action,
        entityType,
        entityId: req.params?.id || null,
        entityName: extractEntityName(req, responseBody),
        method: req.method,
        url: req.originalUrl,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        success: responseStatusCode < 400,
        errorMessage: responseStatusCode >= 400 ? extractErrorMessage(responseBody) : null,
        duration,
        metadata: {
          requestBody: sanitizeRequestBody(req.body),
          queryParams: req.query,
          responseStatusCode,
          responseSize: Buffer.byteLength(JSON.stringify(responseBody || ''))
        }
      });
    } catch (error) {
      console.error('Error al crear registro de auditoría:', error);
    }
  });

  next();
};

// Función para determinar la acción basada en el método y ruta
function determineAction(method, path) {
  const actions = {
    'GET': {
      '/api/auth/login': 'USER_LOGIN',
      '/api/auth/logout': 'USER_LOGOUT',
      '/api/auth/me': 'VIEW_PROFILE'
    },
    'POST': {
      '/api/auth/login': 'USER_LOGIN',
      '/api/auth/register': 'USER_REGISTER',
      '/api/vehicles': 'CREATE_VEHICLE',
      '/api/users': 'CREATE_USER',
      '/api/alerts': 'CREATE_ALERT'
    },
    'PUT': {
      '/api/vehicles/:id': 'UPDATE_VEHICLE',
      '/api/users/:id': 'UPDATE_USER',
      '/api/alerts/:id': 'UPDATE_ALERT'
    },
    'DELETE': {
      '/api/vehicles/:id': 'DELETE_VEHICLE',
      '/api/users/:id': 'DELETE_USER',
      '/api/alerts/:id': 'DELETE_ALERT'
    }
  };

  // Buscar acción específica
  if (actions[method] && actions[method][path]) {
    return actions[method][path];
  }

  // Acciones genéricas por método
  const genericActions = {
    'GET': 'VIEW',
    'POST': 'CREATE',
    'PUT': 'UPDATE',
    'DELETE': 'DELETE',
    'PATCH': 'UPDATE'
  };

  return genericActions[method] || 'UNKNOWN';
}

// Función para determinar el tipo de entidad basada en la ruta
function determineEntityType(path) {
  if (path.includes('/vehicles')) return 'vehicle';
  if (path.includes('/users')) return 'user';
  if (path.includes('/documents')) return 'document';
  if (path.includes('/alerts')) return 'alert';
  if (path.includes('/auth')) return 'system';
  if (path.includes('/erp')) return 'company';
  return 'system';
}

// Función para extraer el nombre de la entidad
function extractEntityName(req, responseBody) {
  try {
    if (typeof responseBody === 'string') {
      responseBody = JSON.parse(responseBody);
    }

    // Para vehículos
    if (req.path.includes('/vehicles') && responseBody?.vehicle) {
      return `${responseBody.vehicle.brand} ${responseBody.vehicle.model} (${responseBody.vehicle.licensePlate})`;
    }

    // Para usuarios
    if (req.path.includes('/users') && responseBody?.user) {
      return responseBody.user.getFullName?.() || `${responseBody.user.firstName} ${responseBody.user.lastName}`;
    }

    // Para documentos
    if (req.path.includes('/documents') && responseBody?.document) {
      return responseBody.document.name;
    }

    // Para alertas
    if (req.path.includes('/alerts') && responseBody?.alert) {
      return responseBody.alert.title;
    }

    return null;
  } catch (error) {
    return null;
  }
}

// Función para extraer mensajes de error
function extractErrorMessage(responseBody) {
  try {
    if (typeof responseBody === 'string') {
      responseBody = JSON.parse(responseBody);
    }

    return responseBody?.message || responseBody?.error || 'Unknown error';
  } catch (error) {
    return 'Unknown error';
  }
}

// Función para sanitizar el cuerpo de la solicitud
function sanitizeRequestBody(body) {
  if (!body || typeof body !== 'object') {
    return body;
  }

  // Crear una copia para no modificar el original
  const sanitized = { ...body };

  // Eliminar campos sensibles
  delete sanitized.password;
  delete sanitized.currentPassword;
  delete sanitized.newPassword;
  delete sanitized.confirmPassword;
  delete sanitized.token;

  return sanitized;
}

// Función para registrar cambios específicos
async function logChanges(userId, entityType, entityId, oldValues, newValues, action = 'UPDATE') {
  try {
    // Calcular diferencias
    const changes = calculateChanges(oldValues, newValues);

    if (Object.keys(changes).length === 0) {
      return; // No hay cambios que registrar
    }

    await AuditLog.create({
      userId,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      changes,
      success: true
    });
  } catch (error) {
    console.error('Error al registrar cambios:', error);
  }
}

// Función para calcular cambios entre objetos
function calculateChanges(oldObj, newObj) {
  const changes = {};

  // Verificar todos los campos del nuevo objeto
  for (const key in newObj) {
    if (newObj.hasOwnProperty(key)) {
      const oldValue = oldObj[key];
      const newValue = newObj[key];

      // Si el valor cambió, registrar el cambio
      if (oldValue !== newValue) {
        changes[key] = {
          old: oldValue,
          new: newValue
        };
      }
    }
  }

  // Verificar campos que existían en el objeto antiguo pero no en el nuevo
  for (const key in oldObj) {
    if (oldObj.hasOwnProperty(key) && !newObj.hasOwnProperty(key)) {
      changes[key] = {
        old: oldObj[key],
        new: null
      };
    }
  }

  return changes;
}

module.exports = {
  auditMiddleware,
  logChanges,
  calculateChanges
};