import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import {
  MY_NEIGHBOURHOOD,
  WHY_NEIGHBOURLY_AID,
  WHY_NEIGHBOURLY_AID_DASHBOARD,
  AVAILABLE_SUPPORT,
  REACH_OUT,
  LOGIN_ROUTE,
  LEADERBOARD,
} from "./constants/routes";
import MyNeighbourhood from "./pages/MyNeighbourhood";
import WhyNeigbourlyAId from "./pages/WhyNeigbourlyAId";
import AuthLayout from "./layouts/AuthLayout";
import AuthPage from "./pages/AuthPage";
import { useContext } from "react";
import AuthContext, { AuthProvider } from "./context/AuthContext";
import Leaderboard from "./pages/LeaderBoard";

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
  return user ? <Navigate to={WHY_NEIGHBOURLY_AID_DASHBOARD} replace /> : children;
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
        {/* Public routes */}
        <Route path={WHY_NEIGHBOURLY_AID} element={<WhyNeigbourlyAId />} />
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
          <Route path={WHY_NEIGHBOURLY_AID_DASHBOARD} element={<WhyNeigbourlyAId />} />
          <Route path={LEADERBOARD} element={<Leaderboard />} />
          {/* <Route path={AVAILABLE_SUPPORT} element={<AvailableSupport />} />
          <Route path={REACH_OUT} element={<ReachOut />} /> */}
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
  return <AppRoutes />;
};

export default Routes;
