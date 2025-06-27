import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "space");
  const [uiMode, setUiMode] = useState(() => localStorage.getItem("uiMode") || "kid");

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("uiMode", uiMode);
  }, [uiMode]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, uiMode, setUiMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
