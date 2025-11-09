const sequelize = require('../config/database');
const User = require('./User');
const Vehicle = require('./Vehicle');
const Document = require('./Document');
const Alert = require('./Alert');
const AuditLog = require('./AuditLog');

// Definir relaciones

// User - Document (un usuario puede tener muchos documentos)
User.hasMany(Document, {
  foreignKey: 'entityId',
  constraints: false,
  scope: {
    entityType: 'user'
  }
});
Document.belongsTo(User, {
  foreignKey: 'entityId',
  constraints: false
});

// Vehicle - Document (un vehículo puede tener muchos documentos)
Vehicle.hasMany(Document, {
  foreignKey: 'entityId',
  constraints: false,
  scope: {
    entityType: 'vehicle'
  }
});
Document.belongsTo(Vehicle, {
  foreignKey: 'entityId',
  constraints: false
});

// User - Alert (un usuario puede tener muchas alertas asignadas)
User.hasMany(Alert, {
  foreignKey: 'assignedTo'
});
Alert.belongsTo(User, {
  foreignKey: 'assignedTo'
});

// Vehicle - Alert (un vehículo puede tener muchas alertas)
Vehicle.hasMany(Alert, {
  foreignKey: 'entityId',
  constraints: false,
  scope: {
    entityType: 'vehicle'
  }
});
Alert.belongsTo(Vehicle, {
  foreignKey: 'entityId',
  constraints: false
});

// User - Alert (un usuario puede tener muchas alertas)
User.hasMany(Alert, {
  foreignKey: 'entityId',
  constraints: false,
  scope: {
    entityType: 'user'
  }
});
Alert.belongsTo(User, {
  foreignKey: 'entityId',
  constraints: false,
  as: 'userAlerts'
});

module.exports = {
  sequelize,
  User,
  Vehicle,
  Document,
  Alert,
  AuditLog
};