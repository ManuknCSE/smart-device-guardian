import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft, Thermometer, Zap, Activity, Clock, AlertTriangle,
  TrendingUp, TrendingDown, Minus, Power, ShieldAlert, Cpu, Gauge
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { HealthRing } from "@/components/HealthRing";
import { getDevice, getDeviceHistory } from "@/lib/devices";

export const Route = createFileRoute("/devices/$deviceId")({
  component: () => (
    <AuthGuard>
      <DashboardLayout>
        <DeviceDetailPage />
      </DashboardLayout>
    </AuthGuard>
  ),
});

const sensorIcons: Record<string, any> = {
  Temperature: Thermometer,
  Current: Zap,
  Voltage: Activity,
  RTC: Clock,
};

function DeviceDetailPage() {
  const { deviceId } = Route.useParams();
  const navigate = useNavigate();
  const device = getDevice(deviceId);
  const history = getDeviceHistory(deviceId);
  const [isOn, setIsOn] = useState(device?.status === "on");

  if (!device) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold">Device not found</h2>
        <Link to="/dashboard" className="text-primary hover:underline mt-2 inline-block">Back to dashboard</Link>
      </div>
    );
  }

  const TrendIcon = device.trend === "increasing" ? TrendingUp : device.trend === "decreasing" ? TrendingDown : Minus;
  const riskColor =
    device.risk === "low" ? "text-success" : device.risk === "medium" ? "text-warning" : "text-destructive";
  const riskBg =
    device.risk === "low" ? "bg-success/10" : device.risk === "medium" ? "bg-warning/10" : "bg-destructive/10";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <button
        onClick={() => navigate({ to: "/dashboard" })}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{device.deviceName}</h1>
          <p className="text-muted-foreground mt-1">Device ID: {device.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOn((s) => !s)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-card ${
              isOn
                ? "bg-success text-success-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Power className="h-4 w-4" />
            {isOn ? "Online" : "Offline"}
          </button>
          <button
            onClick={() => {
              if (confirm("Trigger emergency shutdown via relay?")) setIsOn(false);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gradient-danger text-destructive-foreground shadow-card hover:shadow-elegant transition-all"
          >
            <ShieldAlert className="h-4 w-4" />
            Emergency Stop
          </button>
        </div>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-card border rounded-xl p-6 shadow-card flex items-center gap-5">
          <HealthRing value={device.healthScore} size={120} stroke={10} />
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Health Score</div>
            <div className="text-sm text-muted-foreground mt-1">
              Based on aging analysis of voltage, current, temperature, and runtime.
            </div>
          </div>
        </div>

        <div className="bg-gradient-card border rounded-xl p-6 shadow-card">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Aging Trend</div>
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
              device.trend === "increasing" ? "bg-destructive/10 text-destructive" :
              device.trend === "decreasing" ? "bg-success/10 text-success" :
              "bg-muted text-muted-foreground"
            }`}>
              <TrendIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xl font-bold capitalize">{device.trend}</div>
              <div className="text-xs text-muted-foreground">over last 24 hours</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-card border rounded-xl p-6 shadow-card">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Failure Risk</div>
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${riskBg} ${riskColor}`}>
              <Gauge className="h-6 w-6" />
            </div>
            <div>
              <div className={`text-xl font-bold capitalize ${riskColor}`}>{device.risk}</div>
              <div className="text-xs text-muted-foreground">
                {device.risk === "high" ? "Service immediately" : device.risk === "medium" ? "Monitor closely" : "Operating normally"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live readings */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Reading icon={Thermometer} label="Temperature" value={`${device.temperature}°C`} tone={device.temperature > 70 ? "warning" : "primary"} />
        <Reading icon={Zap} label="Current" value={`${device.current} A`} tone="primary" />
        <Reading icon={Activity} label="Voltage" value={`${device.voltage} V`} tone="primary" />
        <Reading icon={Clock} label="Usage Hours" value={device.usageHours.toLocaleString()} tone="primary" />
      </div>

      {/* Sensors */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" />
          Detected Sensors
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {device.sensors.map((s) => {
            const Icon = sensorIcons[s.type] ?? Activity;
            return (
              <div key={s.name} className="bg-card border rounded-xl p-4 shadow-card hover:shadow-elegant transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {s.type}
                  </span>
                </div>
                <div className="font-semibold">{s.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5 mb-3">{s.description}</div>
                <div className="text-lg font-bold tabular-nums text-primary">{s.value}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Temperature vs Time" color="oklch(0.6 0.22 25)" data={history} dataKey="temperature" unit="°C" />
        <ChartCard title="Current vs Time" color="oklch(0.7 0.18 220)" data={history} dataKey="current" unit="A" />
        <div className="lg:col-span-2">
          <ChartCard title="Cumulative Usage Hours" color="oklch(0.65 0.17 150)" data={history} dataKey="usage" unit="h" area />
        </div>
      </div>

      {/* Alerts */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Alerts
        </h2>
        {device.alerts.length === 0 ? (
          <div className="bg-success/10 border border-success/30 rounded-xl p-4 text-success text-sm">
            ✅ No active alerts. Device operating normally.
          </div>
        ) : (
          <div className="space-y-2">
            {device.alerts.map((a) => (
              <div
                key={a.id}
                className={`flex items-start gap-3 p-4 rounded-xl border ${
                  a.level === "critical"
                    ? "bg-destructive/10 border-destructive/30"
                    : a.level === "warning"
                    ? "bg-warning/10 border-warning/30"
                    : "bg-muted border-border"
                }`}
              >
                <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                  a.level === "critical" ? "text-destructive" : a.level === "warning" ? "text-warning" : "text-muted-foreground"
                }`} />
                <div className="flex-1">
                  <div className="font-medium text-sm">{a.message}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{a.timestamp}</div>
                </div>
                <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${
                  a.level === "critical" ? "bg-destructive text-destructive-foreground" :
                  a.level === "warning" ? "bg-warning text-warning-foreground" : "bg-muted"
                }`}>
                  {a.level}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Reading({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: "primary" | "warning" }) {
  const toneClass = tone === "warning" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary";
  return (
    <div className="bg-card border rounded-xl p-4 shadow-card">
      <div className="flex items-center gap-2 mb-2">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      </div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function ChartCard({ title, color, data, dataKey, unit, area }: any) {
  return (
    <div className="bg-card border rounded-xl p-4 shadow-card">
      <h3 className="font-semibold text-sm mb-3">{title}</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {area ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`g-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="time" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(v: any) => [`${v} ${unit}`, title.split(" vs")[0]]}
              />
              <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#g-${dataKey})`} strokeWidth={2} />
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="time" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(v: any) => [`${v} ${unit}`, title.split(" vs")[0]]}
              />
              <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
