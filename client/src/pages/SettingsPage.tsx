import { useTheme } from '@/components/layout/ThemeProvider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sun, Moon, Keyboard, Check } from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Preferences & Settings
        </h1>
        <p className="text-xs text-muted-foreground">
          Customize your ProjectPilot interface and shortcuts
        </p>
      </div>

      {/* Appearance Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Appearance Theme</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Select your preferred visual mode. Choose between high-contrast Bright (Light) or immersive Dark mode.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between h-28 relative ${
                theme === 'light'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border/60 hover:border-border bg-card'
              }`}
              onClick={() => setTheme('light')}
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <Sun className="h-5 w-5" />
                </div>
                {theme === 'light' && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                    <Check className="h-3.5 w-3.5" /> Active
                  </span>
                )}
              </div>
              <div>
                <div className="font-medium text-sm text-foreground">Bright / Light</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">High clarity daytime view</div>
              </div>
            </button>

            <button
              type="button"
              className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between h-28 relative ${
                theme === 'dark'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border/60 hover:border-border bg-card'
              }`}
              onClick={() => setTheme('dark')}
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                  <Moon className="h-5 w-5" />
                </div>
                {theme === 'dark' && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                    <Check className="h-3.5 w-3.5" /> Active
                  </span>
                )}
              </div>
              <div>
                <div className="font-medium text-sm text-foreground">Dark Mode</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Reduced eye strain</div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Keyboard className="h-4 w-4" /> Keyboard Shortcuts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y text-xs">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-muted-foreground">Open Command Palette</span>
              <kbd className="px-2 py-1 rounded bg-muted font-mono font-bold text-foreground">
                ⌘ / Ctrl + K
              </kbd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-muted-foreground">Focus Search Filter</span>
              <kbd className="px-2 py-1 rounded bg-muted font-mono font-bold text-foreground">
                /
              </kbd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-muted-foreground">Close Dialogs & Modals</span>
              <kbd className="px-2 py-1 rounded bg-muted font-mono font-bold text-foreground">
                Esc
              </kbd>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
