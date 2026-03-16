import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthContextProvider } from "./AuthContext.jsx";
import { ThemeContextProvider } from "./ThemeContext.jsx";

createRoot(document.getElementById("root")).render(
  <ThemeContextProvider>
    <AuthContextProvider>
      <App />
    </AuthContextProvider>
  </ThemeContextProvider>
);
