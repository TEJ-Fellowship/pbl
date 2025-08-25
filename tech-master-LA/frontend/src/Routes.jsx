import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import LearningPortal from "./pages/LearningPortal";
import {
  AI_CHAT,
  HOME_ROUTE,
  LOGIN_ROUTE,
  SMART_QUIZZES,
  TRACK_PROGRESS,
} from "./constants/routes";
import AiChat from "./pages/AiChat";
import SmartQuizzes from "./pages/SmartQuizzes";
import TrackProgress from "./pages/TrackProgress";
import LoginRegister from "./pages/LoginRegister";
import AuthLayout from "./layouts/AuthLayout";
import Quizzes from "./pages/Quizzes";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to={LOGIN_ROUTE} replace />;
};

// Public Route component (redirects to home if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <Navigate to={HOME_ROUTE} replace /> : children;
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
              <LoginRegister />
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
          <Route index element={<LearningPortal />} />
          <Route path={HOME_ROUTE} element={<LearningPortal />} />
          <Route path={AI_CHAT} element={<AiChat />} />
          <Route path={SMART_QUIZZES} element={<Quizzes />} />
          <Route path={TRACK_PROGRESS} element={<TrackProgress />} />
        </Route>

        {/* Catch all route - redirect based on auth */}
        <Route
          path="*"
          element={
            <Navigate to={useAuth().user ? HOME_ROUTE : LOGIN_ROUTE} replace />
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
