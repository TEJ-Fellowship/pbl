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

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("authToken");
  return token ? children : <Navigate to={LOGIN_ROUTE} replace />;
};

// Public Route component (redirects to home if already logged in)
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("authToken");
  return token ? <Navigate to={HOME_ROUTE} replace /> : children;
};

const Routes = () => {
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
          <Route path={SMART_QUIZZES} element={<SmartQuizzes />} />
          <Route path={TRACK_PROGRESS} element={<TrackProgress />} />
        </Route>

        {/* Catch all route - redirect to login if not authenticated, home if authenticated */}
        <Route
          path="*"
          element={
            <Navigate
              to={localStorage.getItem("authToken") ? HOME_ROUTE : LOGIN_ROUTE}
              replace
            />
          }
        />
      </>
    )
  );
  return <RouterProvider router={router} />;
};

export default Routes;
