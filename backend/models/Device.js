const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema({
  name: String,
  type: String,
  description: String,
  value: Number
}, { _id: false });

const deviceSchema = new mongoose.Schema({
  deviceName: {
    type: String,
    required: true,
  },
  temperature: {
    type: Number,
    required: true,
  },
  current: {
    type: Number,
    required: true,
  },
  voltage: {
    type: Number,
    required: true,
  },
  usageHours: {
    type: Number,
    required: true,
  },
  healthScore: {
    type: Number,
  },
  risk: {
    type: String,
  },
  sensors: [sensorSchema],
  alerts: [String],
  trend: {
    type: String,
    default: 'stable',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;
