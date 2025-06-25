import Routes from "./Routes";
import { Toaster } from "react-hot-toast";

const App = () => {
  return (
    <div>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 2000,
          style: {
            background: "#1a1a1a",
            color: "#ffffff",
            border: "1px solid #333333",
            borderRadius: "12px",
            padding: "16px",
            fontSize: "14px",
            fontWeight: "500",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(10px)",
          },
          success: {
            style: {
              background: "#1a1a1a",
              color: "#10b981", // Green text for success
              border: "1px solid #10b981",
              borderRadius: "12px",
              padding: "16px",
              fontSize: "14px",
              fontWeight: "500",
              boxShadow: "0 8px 32px rgba(16, 185, 129, 0.2)",
              backdropFilter: "blur(10px)",
            },
            iconTheme: {
              primary: "#10b981",
              secondary: "#1a1a1a",
            },
          },
          error: {
            style: {
              background: "#1a1a1a",
              color: "#ef4444", // Red text for errors
              border: "1px solid #ef4444",
              borderRadius: "12px",
              padding: "16px",
              fontSize: "14px",
              fontWeight: "500",
              boxShadow: "0 8px 32px rgba(239, 68, 68, 0.2)",
              backdropFilter: "blur(10px)",
            },
            iconTheme: {
              primary: "#ef4444",
              secondary: "#1a1a1a",
            },
          },
        }}
      />
      <Routes />
    </div>
  );
};

export default App;
