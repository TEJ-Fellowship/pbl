import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * A Route Guard that redirects unauthenticated users to the /auth page.
 * It saves the current location so the user can be sent back after login.
 */
export default function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();  //looks at the browser's address bar and grabs the current URL (like /my-shelf)

  if (!isAuthenticated) {
    return (
        // Replace the current entry in history to prevent "back button" loops
        // Pass the current path as 'state' so we can redirect back here after login
      <Navigate to="/auth" replace state={{ from: location.pathname }} />
    );
  }

  return children;
}
