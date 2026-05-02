import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/components/AuthGuard";
import { auth } from "@/lib/auth";
import { LogOut, User as UserIcon, Mail, Shield } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: () => (
    <AuthGuard>
      <DashboardLayout>
        <ProfilePage />
      </DashboardLayout>
    </AuthGuard>
  ),
});

function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const logout = () => {
    auth.logout();
    navigate({ to: "/login" });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account</p>
      </div>

      <div className="bg-gradient-card border rounded-xl p-6 shadow-card">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-glow">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div>
            <div className="text-xl font-semibold">{user?.name}</div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
          </div>
        </div>

        <div className="space-y-3">
          <Field icon={UserIcon} label="Name" value={user?.name ?? ""} />
          <Field icon={Mail} label="Email" value={user?.email ?? ""} />
          <Field icon={Shield} label="Account Status" value="Active · Authenticated" />
        </div>
      </div>

      <button
        onClick={logout}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-destructive text-destructive-foreground font-medium hover:opacity-90 transition shadow-card"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  );
}

function Field({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className="font-medium truncate">{value}</div>
      </div>
    </div>
  );
}
