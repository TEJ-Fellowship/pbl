import React, { useState, createContext, useEffect } from "react";

export const ThemeContext = createContext();

export const ThemeContextProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  function handleToggle() {
    setIsDark((prev) => {
      const newTheme = !prev;
      localStorage.setItem("theme", JSON.stringify(newTheme)); // Save choice
      return newTheme;
    });
  }

  // Sync theme to localStorage if changed
  useEffect(() => {
    localStorage.setItem("theme", JSON.stringify(isDark));
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, handleToggle }}>
      {children}
    </ThemeContext.Provider>
  );
};