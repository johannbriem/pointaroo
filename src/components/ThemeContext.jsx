// ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "space");
  const [uiMode, setUiMode] = useState(() => localStorage.getItem("uiMode") || "kid");

  // Side effect: set data attributes and theme classes on <body>
  useEffect(() => {
    const body = document.body;

    // Clear old theme classes
    body.className = body.className
      .split(" ")
      .filter((cls) => !cls.startsWith("theme-"))
      .join(" ");

    body.setAttribute("data-ui-mode", uiMode);
    body.setAttribute("data-theme", theme);
    body.classList.add(`theme-${theme}`);
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
