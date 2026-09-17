import React from 'react';
import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ThemeToggleProps {
  className?: string;
}

/**
 * Single-click theme toggle button.
 * Click once → instantly switches between Bright (light) and Dark.
 * No dropdown, no confirmation needed.
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();

  const isDark = theme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`relative h-8 w-8 rounded-lg border border-border/40 bg-background/50 backdrop-blur hover:bg-accent transition-all ${className}`}
      title={isDark ? 'Switch to Bright mode' : 'Switch to Dark mode'}
      aria-label={isDark ? 'Switch to Bright mode' : 'Switch to Dark mode'}
    >
      {/* Sun shown in light mode */}
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
      {/* Moon shown in dark mode */}
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-sky-400" />
    </Button>
  );
};
