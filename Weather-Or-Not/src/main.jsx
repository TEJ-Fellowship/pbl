import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { Toaster } from "sonner";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Toaster
      position="top-center"
      richColors
      toastOptions={{
        style: {
          minWidth: "400px",
          maxWidth: "600px",
        },
      }}
    />
    <App />
  </StrictMode>
);
