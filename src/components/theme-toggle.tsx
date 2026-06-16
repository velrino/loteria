import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme !== "light";
  const Icon = isDark ? Moon : Sun;
  const label = isDark ? "Tema escuro" : "Tema claro";

  return (
    <Button
      type="button"
      size="icon"
      variant="default"
      title={label}
      aria-label={label}
      aria-pressed={isDark}
      className="fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full border border-border shadow-lg shadow-primary/25 sm:bottom-6 sm:right-6"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Icon className="h-5 w-5" />
    </Button>
  );
}
