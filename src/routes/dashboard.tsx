import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DeviceCard } from "@/components/DeviceCard";
import { getDevices } from "@/lib/devices";
import { Activity, AlertTriangle, CheckCircle2, Cpu } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: () => (
    <AuthGuard>
      <DashboardLayout>
        <DashboardPage />
      </DashboardLayout>
    </AuthGuard>
  ),
});

function DashboardPage() {
  const devices = getDevices();
  const total = devices.length;
  const healthy = devices.filter((d) => d.healthScore >= 75).length;
  const aging = devices.filter((d) => d.healthScore >= 50 && d.healthScore < 75).length;
  const risky = devices.filter((d) => d.healthScore < 50).length;
  const avg = Math.round(devices.reduce((a, d) => a + d.healthScore, 0) / total);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Fleet Overview</h1>
        <p className="text-muted-foreground mt-1">Live monitoring across {total} connected devices</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Devices" value={total} icon={Cpu} tone="primary" />
        <KpiCard label="Healthy" value={healthy} icon={CheckCircle2} tone="success" />
        <KpiCard label="Aging" value={aging} icon={Activity} tone="warning" />
        <KpiCard label="At Risk" value={risky} icon={AlertTriangle} tone="destructive" />
      </div>

      <div className="bg-gradient-card border rounded-xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Fleet Health</h2>
          <span className="text-2xl font-bold tabular-nums" style={{
            color: avg >= 75 ? "var(--color-success)" : avg >= 50 ? "var(--color-warning)" : "var(--color-destructive)"
          }}>{avg}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 bg-gradient-primary"
            style={{ width: `${avg}%` }}
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Devices</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((d) => (
            <DeviceCard key={d.id} device={d} />
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: any; tone: "primary" | "success" | "warning" | "destructive" }) {
  const map = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    destructive: "bg-destructive/15 text-destructive",
  };
  return (
    <div className="bg-card border rounded-xl p-4 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className="text-2xl font-bold tabular-nums mt-1">{value}</div>
        </div>
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${map[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
