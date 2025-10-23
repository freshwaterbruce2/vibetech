
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeProvider";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full transition-all duration-300 hover:bg-aura-accent/10"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-aura-textSecondary hover:text-aura-text transition-colors" />
      ) : (
        <Moon className="h-5 w-5 text-aura-textSecondary hover:text-aura-text transition-colors" />
      )}
    </Button>
  );
}
