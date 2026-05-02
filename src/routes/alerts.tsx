import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { getDevices } from "@/lib/devices";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/alerts")({
  component: () => (
    <AuthGuard>
      <DashboardLayout>
        <AlertsPage />
      </DashboardLayout>
    </AuthGuard>
  ),
});

function AlertsPage() {
  const all = getDevices().flatMap((d) => d.alerts.map((a) => ({ ...a, deviceName: d.deviceName })));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Alerts</h1>
        <p className="text-muted-foreground mt-1">{all.length} active across your fleet</p>
      </div>

      {all.length === 0 ? (
        <div className="bg-success/10 border border-success/30 rounded-xl p-6 flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-success" />
          <div>
            <div className="font-semibold text-success">All systems normal</div>
            <div className="text-sm text-muted-foreground">No active alerts at this time.</div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {all.map((a) => (
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
                <div className="text-xs text-muted-foreground mt-0.5">{a.deviceName} · {a.timestamp}</div>
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
  );
}
