import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import ThemeProvider from "./layouts/ThemeProvider.jsx";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  </StrictMode>
);
