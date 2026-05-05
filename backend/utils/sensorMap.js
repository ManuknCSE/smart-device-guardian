const sensorMappings = {
  'DS18B20': { type: 'Temperature', description: 'Measures device heat' },
  'ACS712': { type: 'Current', description: 'Measures current' },
  'ZMPT101B': { type: 'Voltage', description: 'Measures voltage' },
  'DS3231': { type: 'RTC', description: 'Tracks usage time' },
};

const getSensorInfo = (sensorName) => {
  return sensorMappings[sensorName] || { type: 'Custom Sensor', description: 'Unknown sensor type' };
};

module.exports = { getSensorInfo };
