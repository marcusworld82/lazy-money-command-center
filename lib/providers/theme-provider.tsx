"use client";

import * as React from "react";

type Theme = "dark" | "light";

const STORAGE_KEY = "lm-os:theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

/**
 * Minimal dark/light provider. Deliberately not next-themes: its inline
 * bootstrap <script> triggers a React 19 / Next 16 console warning and,
 * combined with resolvedTheme's async resolution, produced a real hydration
 * mismatch. Dark is the default and matches the un-classed CSS tokens
 * (see globals.css), so the common case never mismatches; only a saved
 * "light" preference does a one-time class swap after mount.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("dark");

  React.useEffect(() => {
    // Deliberate: localStorage isn't available during SSR, so a saved "light"
    // preference is applied in a client-only pass after mount.
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === "light") {
      document.documentElement.classList.add("light");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThemeState("light");
    }
  }, []);

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.classList.toggle("light", next === "light");
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
