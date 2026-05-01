import { createContext, useContext, useState } from "react";

const ThemeContext = createContext<any>(null);

export const ThemeProvider = ({ children }: any) => {
  const [darkMode, setDarkMode] = useState(false);

  const theme = {
    darkMode,

    colors: {
      background: darkMode ? "#121212" : "#ffffff",
      card: darkMode ? "#1e1e1e" : "#f5f5f5",
      text: darkMode ? "#ffffff" : "#000000",
      subText: darkMode ? "#aaaaaa" : "#555555",
    },

    toggleTheme: () => setDarkMode(!darkMode),
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);