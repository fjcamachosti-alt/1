const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vehicle = sequelize.define('Vehicle', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  licensePlate: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: false
  },
  model: {
    type: DataTypes.STRING,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  chassisNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  engineNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true
  },
  vehicleType: {
    type: DataTypes.ENUM('ambulancia_tipo_A', 'ambulancia_tipo_B', 'ambulancia_tipo_C', 'vehiculo_soporte', 'vehiculo_transporte'),
    defaultValue: 'ambulancia_tipo_A'
  },
  fuelType: {
    type: DataTypes.ENUM('gasolina', 'diesel', 'electric', 'hybrid'),
    defaultValue: 'diesel'
  },
  transmission: {
    type: DataTypes.ENUM('manual', 'automatic'),
    defaultValue: 'manual'
  },
  mileage: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('available', 'in_service', 'maintenance', 'repair', 'retired'),
    defaultValue: 'available'
  },
  visibility: {
    type: DataTypes.ENUM('visible', 'hidden'),
    defaultValue: 'visible'
  },
  acquisitionDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  acquisitionPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  insuranceCompany: {
    type: DataTypes.STRING,
    allowNull: true
  },
  insurancePolicy: {
    type: DataTypes.STRING,
    allowNull: true
  },
  insuranceExpiration: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  itvDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  itvExpiration: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  nextMaintenanceDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  nextMaintenanceMileage: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  lastMaintenanceDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  lastMaintenanceMileage: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  garage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  radioCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gpsDevice: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emergencyEquipment: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  medicalEquipment: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['licensePlate']
    },
    {
      fields: ['status']
    },
    {
      fields: ['brand', 'model']
    }
  ]
});

module.exports = Vehicle;