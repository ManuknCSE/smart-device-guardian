import { Link } from "@tanstack/react-router";
import { Thermometer, Zap, Activity, Clock } from "lucide-react";
import { HealthRing } from "./HealthRing";
import type { Device } from "@/lib/devices";

export function DeviceCard({ device }: { device: Device }) {
  const statusColor =
    device.healthScore >= 75
      ? "border-l-success"
      : device.healthScore >= 50
      ? "border-l-warning"
      : "border-l-destructive";

  const riskBadge =
    device.risk === "low"
      ? "bg-success/15 text-success"
      : device.risk === "medium"
      ? "bg-warning/15 text-warning"
      : "bg-destructive/15 text-destructive";

  return (
    <Link
      to="/devices/$deviceId"
      params={{ deviceId: device.id }}
      className={`group block bg-gradient-card border-l-4 ${statusColor} border rounded-xl p-5 shadow-card hover:shadow-elegant transition-all hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-base group-hover:text-primary transition-colors">{device.deviceName}</h3>
          <span className={`inline-block mt-1.5 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${riskBadge}`}>
            {device.risk} risk
          </span>
        </div>
        <HealthRing value={device.healthScore} size={64} stroke={6} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Stat icon={Thermometer} label="Temp" value={`${device.temperature}°C`} />
        <Stat icon={Zap} label="Current" value={`${device.current} A`} />
        <Stat icon={Activity} label="Voltage" value={`${device.voltage} V`} />
        <Stat icon={Clock} label="Usage" value={`${device.usageHours.toLocaleString()}h`} />
      </div>
    </Link>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="font-semibold tabular-nums truncate">{value}</div>
      </div>
    </div>
  );
}
