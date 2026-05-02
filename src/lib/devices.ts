export type Sensor = {
  name: string;
  type: "Temperature" | "Current" | "Voltage" | "RTC";
  description: string;
  value: string;
};

export type Alert = {
  id: string;
  level: "warning" | "critical" | "info";
  message: string;
  timestamp: string;
};

export type Device = {
  id: string;
  deviceName: string;
  healthScore: number;
  temperature: number;
  current: number;
  voltage: number;
  usageHours: number;
  status: "on" | "off";
  sensors: Sensor[];
  alerts: Alert[];
  trend: "increasing" | "decreasing" | "stable";
  risk: "low" | "medium" | "high";
};

const baseDevices: Device[] = [
  {
    id: "dev-001",
    deviceName: "Industrial Motor A1",
    healthScore: 87,
    temperature: 42.5,
    current: 12.3,
    voltage: 230.1,
    usageHours: 4280,
    status: "on",
    trend: "stable",
    risk: "low",
    sensors: [
      { name: "DS18B20", type: "Temperature", description: "Digital temperature sensor", value: "42.5 °C" },
      { name: "ACS712", type: "Current", description: "Hall-effect current sensor", value: "12.3 A" },
      { name: "ZMPT101B", type: "Voltage", description: "Precision AC voltage sensor", value: "230.1 V" },
      { name: "DS3231", type: "RTC", description: "Real-time clock module", value: "Synced" },
    ],
    alerts: [],
  },
  {
    id: "dev-002",
    deviceName: "HVAC Compressor B2",
    healthScore: 64,
    temperature: 68.2,
    current: 18.7,
    voltage: 228.4,
    usageHours: 9120,
    status: "on",
    trend: "increasing",
    risk: "medium",
    sensors: [
      { name: "DS18B20", type: "Temperature", description: "Digital temperature sensor", value: "68.2 °C" },
      { name: "ACS712", type: "Current", description: "Hall-effect current sensor", value: "18.7 A" },
      { name: "ZMPT101B", type: "Voltage", description: "Precision AC voltage sensor", value: "228.4 V" },
      { name: "DS3231", type: "RTC", description: "Real-time clock module", value: "Synced" },
    ],
    alerts: [
      { id: "a1", level: "warning", message: "Temperature trending upward over last 24h", timestamp: "2m ago" },
    ],
  },
  {
    id: "dev-003",
    deviceName: "Power Transformer C3",
    healthScore: 38,
    temperature: 84.6,
    current: 24.1,
    voltage: 215.8,
    usageHours: 14820,
    status: "on",
    trend: "increasing",
    risk: "high",
    sensors: [
      { name: "DS18B20", type: "Temperature", description: "Digital temperature sensor", value: "84.6 °C" },
      { name: "ACS712", type: "Current", description: "Hall-effect current sensor", value: "24.1 A" },
      { name: "ZMPT101B", type: "Voltage", description: "Precision AC voltage sensor", value: "215.8 V" },
      { name: "DS3231", type: "RTC", description: "Real-time clock module", value: "Synced" },
    ],
    alerts: [
      { id: "a2", level: "critical", message: "High temperature exceeds safe threshold (>80°C)", timestamp: "5m ago" },
      { id: "a3", level: "critical", message: "Failure risk: HIGH — service recommended", timestamp: "5m ago" },
      { id: "a4", level: "warning", message: "Voltage drop detected", timestamp: "1h ago" },
    ],
  },
  {
    id: "dev-004",
    deviceName: "Conveyor Drive D4",
    healthScore: 92,
    temperature: 35.1,
    current: 8.4,
    voltage: 232.0,
    usageHours: 1240,
    status: "on",
    trend: "stable",
    risk: "low",
    sensors: [
      { name: "DS18B20", type: "Temperature", description: "Digital temperature sensor", value: "35.1 °C" },
      { name: "ACS712", type: "Current", description: "Hall-effect current sensor", value: "8.4 A" },
      { name: "ZMPT101B", type: "Voltage", description: "Precision AC voltage sensor", value: "232.0 V" },
      { name: "DS3231", type: "RTC", description: "Real-time clock module", value: "Synced" },
    ],
    alerts: [],
  },
];

export function getDevices(): Device[] {
  return baseDevices;
}

export function getDevice(id: string): Device | undefined {
  return baseDevices.find((d) => d.id === id);
}

export function getDeviceHistory(id: string) {
  const dev = getDevice(id);
  if (!dev) return [];
  // generate 24 hours of synthetic data
  const points = [];
  for (let i = 23; i >= 0; i--) {
    const noise = (Math.sin(i / 3) + Math.random() * 0.5 - 0.25);
    points.push({
      time: `${String(23 - i).padStart(2, "0")}:00`,
      temperature: +(dev.temperature + noise * 4 - i * 0.1).toFixed(1),
      current: +(dev.current + noise * 1.5).toFixed(2),
      usage: +(dev.usageHours - i * 1.2).toFixed(0),
    });
  }
  return points;
}
