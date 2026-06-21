"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | string;

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue>({ theme: "light", setTheme: () => {} });

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored) {
        setThemeState(stored);
        if (stored === "dark") document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
      } else {
        // default to light
        document.documentElement.classList.remove("dark");
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const setTheme = (t: Theme) => {
    try {
      // disable transitions briefly
      document.documentElement.classList.add("disable-theme-transitions");
      window.setTimeout(() => document.documentElement.classList.remove("disable-theme-transitions"), 50);

      if (t === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", String(t));
      setThemeState(t);
    } catch (e) {}
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeProvider;
