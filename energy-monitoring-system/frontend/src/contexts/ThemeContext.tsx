import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('ecostep-theme');
    return (stored === 'dark' ? 'dark' : 'light') as Theme;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);
    localStorage.setItem('ecostep-theme', theme);
  }, [theme]);

  // High-performance theme toggle: disables transition repaint stalls during color swap
  const toggleTheme = () => {
    const root = document.documentElement;
    root.classList.add('no-transitions');
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.remove('no-transitions');
      });
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'dark' as Theme,
      toggleTheme: () => {},
    };
  }
  return context;
}
