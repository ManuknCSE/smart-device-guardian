import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { auth, type User } from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setUser(auth.getUser());
    setLoading(false);
  }, []);
  return { user, loading, setUser };
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!auth.getUser()) {
      navigate({ to: "/login" });
    } else {
      setReady(true);
    }
  }, [navigate]);
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  return <>{children}</>;
}
