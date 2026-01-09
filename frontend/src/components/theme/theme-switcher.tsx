'use client';

import { useTheme } from '@/contexts/theme-context';
import { ThemeColor, themeColors } from '@/lib/theme-config';
import { useLocale } from '@/components/local-lang-swither';
import { getMessages } from '@/lib/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeSwitcher() {
  const { theme, setThemeColor, toggleThemeMode } = useTheme();
  const { locale } = useLocale();
  const t = getMessages(locale);

  const handleColorChange = (color: ThemeColor) => {
    setThemeColor(color);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Color Theme Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Palette className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">{t.theme.selectColor}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t.theme.colorScheme}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(Object.keys(themeColors) as ThemeColor[]).map((color) => (
            <DropdownMenuItem
              key={color}
              onClick={() => handleColorChange(color)}
              className="flex items-center gap-2"
            >
              <div
                className={cn(
                  'h-4 w-4 rounded-full border',
                  theme.color === color && 'ring-2 ring-offset-2 ring-primary'
                )}
                style={{
                  backgroundColor: themeColors[color].primary,
                }}
              />
              {t.theme.colors[color] || themeColors[color].name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dark/Light Mode Toggle */}
      <Button variant="outline" size="icon" onClick={toggleThemeMode}>
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">{t.theme.toggleMode}</span>
      </Button>
    </div>
  );
}
