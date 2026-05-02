import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DeviceCard } from "@/components/DeviceCard";
import { getDevices } from "@/lib/devices";

export const Route = createFileRoute("/devices/")({
  component: () => (
    <AuthGuard>
      <DashboardLayout>
        <DevicesPage />
      </DashboardLayout>
    </AuthGuard>
  ),
});

function DevicesPage() {
  const devices = getDevices();
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">All Devices</h1>
        <p className="text-muted-foreground mt-1">{devices.length} connected devices</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((d) => (
          <DeviceCard key={d.id} device={d} />
        ))}
      </div>
    </div>
  );
}
