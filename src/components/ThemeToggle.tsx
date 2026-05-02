import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

type Theme = "light" | "dark" | "system";

function applyTheme(theme: Theme) {
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = (localStorage.getItem("iot_theme") as Theme | null) ?? "system";
    setTheme(stored);
    applyTheme(stored);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const current = (localStorage.getItem("iot_theme") as Theme | null) ?? "system";
      if (current === "system") applyTheme("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const cycle = () => {
    const next: Theme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
    localStorage.setItem("iot_theme", next);
    applyTheme(next);
  };

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const label = theme === "light" ? "Light" : theme === "dark" ? "Dark" : "Auto";

  return (
    <button
      onClick={cycle}
      title={`Theme: ${label} (click to change)`}
      className="h-9 w-9 rounded-lg bg-muted hover:bg-accent flex items-center justify-center transition-colors"
      aria-label="Toggle theme"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
