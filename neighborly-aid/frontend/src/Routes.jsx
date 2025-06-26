import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import {
  MY_NEIGHBOURHOOD,
  WHY_NEIGHBORLY_AID,
  AVAILABLE_SUPPORT,
  REACH_OUT,
  LOGIN_ROUTE,
} from "./constants/routes";
import MyNeighbourhood from "./pages/MyNeighbourhood";
import WhyNeigbourlyAId from "./pages/WhyNeigbourlyAId";
import AvailableSupport from "./pages/AvailableSupport";
import ReachOut from "./pages/ReachOut";
import AuthLayout from "./layouts/AuthLayout";
import AuthPage from "./pages/AuthPage";
import { useContext } from "react";
import AuthContext, { AuthProvider } from "./context/AuthContext";

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to={LOGIN_ROUTE} replace />;
};

// Public Route component (redirects to home if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  return user ? <Navigate to={MY_NEIGHBOURHOOD} replace /> : children;
};

const AppRoutes = () => {
  const { user } = useContext(AuthContext);
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        {/* Public routes */}
        <Route
          path={LOGIN_ROUTE}
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AuthLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={MY_NEIGHBOURHOOD} replace />} />
          <Route path={MY_NEIGHBOURHOOD} element={<MyNeighbourhood />} />
          <Route path={WHY_NEIGHBORLY_AID} element={<WhyNeigbourlyAId />} />
          <Route path={AVAILABLE_SUPPORT} element={<AvailableSupport />} />
          <Route path={REACH_OUT} element={<ReachOut />} />
        </Route>

        {/* Catch all route - redirect based on auth */}
        <Route
          path="*"
          element={
            <Navigate to={user ? MY_NEIGHBOURHOOD : LOGIN_ROUTE} replace />
          }
        />
      </>
    )
  );
  return <RouterProvider router={router} />;
};

const Routes = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default Routes;
