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

// Simple auth state management
let isAuthenticated = true;
let currentUser = null;

// Auth functions
const login = (userData) => {
  isAuthenticated = true;
  currentUser = userData;
  // Force a page reload to update the routes
  window.location.href = MY_NEIGHBOURHOOD;
};

const logout = () => {
  isAuthenticated = false;
  currentUser = null;
  window.location.href = LOGIN_ROUTE;
};

// Protected Route component
const ProtectedRoute = ({ children }) => {
  return isAuthenticated ? children : <Navigate to={LOGIN_ROUTE} replace />;
};

// Public Route component (redirects to home if already logged in)
const PublicRoute = ({ children }) => {
  return isAuthenticated ? (
    <Navigate to={MY_NEIGHBOURHOOD} replace />
  ) : (
    children
  );
};

const AppRoutes = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        {/* Public routes */}
        <Route
          path={LOGIN_ROUTE}
          element={
            <PublicRoute>
              <AuthPage onLogin={login} />
            </PublicRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AuthLayout user={currentUser} onLogout={logout} />
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
            <Navigate
              to={isAuthenticated ? MY_NEIGHBOURHOOD : LOGIN_ROUTE}
              replace
            />
          }
        />
      </>
    )
  );
  return <RouterProvider router={router} />;
};

const Routes = () => {
  return <AppRoutes />;
};

export default Routes;
