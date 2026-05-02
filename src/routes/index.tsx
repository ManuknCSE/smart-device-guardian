import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    if (auth.getUser()) navigate({ to: "/dashboard" });
    else navigate({ to: "/login" });
  }, [navigate]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
