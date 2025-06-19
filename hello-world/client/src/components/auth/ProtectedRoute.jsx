import { useAuth } from "../../contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

const ProtectedRoute = ({
  children,
  requiredRole = null,
  requiredPermission = null,
  fallback = null,
}) => {
  const { isAuthenticated, loading, user, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary-600" />
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    if (fallback) {
      return fallback;
    }
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md p-6 mx-auto text-center">
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <h2 className="mb-2 text-lg font-semibold text-red-800">
              Access Denied
            </h2>
            <p className="text-red-600">
              You don't have the required role ({requiredRole}) to access this
              page.
            </p>
            <p className="mt-2 text-sm text-red-500">
              Your current role: {user?.role}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    if (fallback) {
      return fallback;
    }
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md p-6 mx-auto text-center">
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <h2 className="mb-2 text-lg font-semibold text-red-800">
              Access Denied
            </h2>
            <p className="text-red-600">
              You don't have the required permission ({requiredPermission}) to
              access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
