import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

function ProtectedRoute({ children }) {
  const { isLoggedIn, authChecked } = useContext(AuthContext);
  if (!authChecked) {
    return null;
  }
  if (isLoggedIn === false) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default ProtectedRoute;
