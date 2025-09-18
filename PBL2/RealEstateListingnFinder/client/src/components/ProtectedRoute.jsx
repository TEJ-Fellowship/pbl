import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // If still loading, show a loading spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated, redirect to auth page with a message
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/auth"
        replace
        state={{ message: "Please sign in to go the dashboard" }}
      />
    );
  }

  // If authenticated, render the children
  return children;
};

export default ProtectedRoute;
