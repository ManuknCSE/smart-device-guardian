const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const Device = require('../models/Device');
const { protect } = require('../middleware/authMiddleware');
const { getSensorInfo } = require('../utils/sensorMap');

const callMLPredict = (temperature, current, voltage, usageHours) => {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../ml/predict.py');
    const pythonProcess = spawn('python', [pythonScript, temperature, current, voltage, usageHours]);

    let dataString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      try {
        const result = JSON.parse(dataString);
        if (result.error) {
          reject(result.error);
        } else {
          resolve(result);
        }
      } catch (err) {
        reject('Error parsing ML response: ' + err.message);
      }
    });
  });
};

// @route   POST /api/devices
// @desc    Add new device data (triggers ML & Alerts)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { deviceName, temperature, current, voltage, usageHours, sensors } = req.body;

    // Process and enrich sensors
    let enrichedSensors = [];
    if (sensors && Array.isArray(sensors)) {
      enrichedSensors = sensors.map((sensor) => {
        const info = getSensorInfo(sensor.name);
        return {
          name: sensor.name,
          type: info.type,
          description: info.description,
          value: sensor.value
        };
      });
    }

    // Call ML prediction
    let healthScore = 100;
    let risk = 'low';
    
    try {
      const mlResult = await callMLPredict(temperature, current, voltage, usageHours);
      healthScore = mlResult.healthScore;
      risk = mlResult.risk;
    } catch (err) {
      console.error('ML Prediction failed, using default values:', err);
    }

    // Generate alerts
    const alerts = [];
    if (temperature > 75) {
      alerts.push('High temperature');
    }
    if (current > 8) { // Arbitrary threshold
      alerts.push('Possible wear');
    }
    if (healthScore < 60) {
      alerts.push('Maintenance required');
    }
    if (risk === 'high') {
      alerts.push('Failure risk high');
    }

    const device = await Device.create({
      deviceName,
      temperature,
      current,
      voltage,
      usageHours,
      healthScore,
      risk,
      sensors: enrichedSensors,
      alerts,
    });

    res.status(201).json(device);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/devices
// @desc    Get all devices
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const devices = await Device.find({});
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/devices/:id
// @desc    Get single device
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (device) {
      res.json(device);
    } else {
      res.status(404).json({ message: 'Device not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/devices/:id
// @desc    Update device
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (device) {
      Object.assign(device, req.body);
      
      // Update alerts based on new data if needed
      const alerts = [];
      if (device.temperature > 75) alerts.push('High temperature');
      if (device.current > 8) alerts.push('Possible wear');
      if (device.healthScore < 60) alerts.push('Maintenance required');
      if (device.risk === 'high') alerts.push('Failure risk high');
      
      device.alerts = alerts;

      const updatedDevice = await device.save();
      res.json(updatedDevice);
    } else {
      res.status(404).json({ message: 'Device not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/devices/:id
// @desc    Delete device
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (device) {
      await device.deleteOne();
      res.json({ message: 'Device removed' });
    } else {
      res.status(404).json({ message: 'Device not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
