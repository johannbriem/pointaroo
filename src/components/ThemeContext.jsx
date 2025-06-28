// ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "space");
  const [uiMode, setUiMode] = useState(() => localStorage.getItem("uiMode") || "kid");

  // Side effect: set data attributes and theme classes on <body>
  useEffect(() => {
    const body = document.body;

    body.setAttribute("data-ui-mode", uiMode);
    body.setAttribute("data-theme", uiMode === "kid" ? "kids" : "modern");

    // Clear all `theme-*` classes
    body.className = body.className.replace(/theme-\w+/g, "").trim();

    if (uiMode === "kid") {
      body.classList.add(`theme-${theme}`);
    }

    localStorage.setItem("theme", theme);
    localStorage.setItem("uiMode", uiMode);
  }, [theme, uiMode]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, uiMode, setUiMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
