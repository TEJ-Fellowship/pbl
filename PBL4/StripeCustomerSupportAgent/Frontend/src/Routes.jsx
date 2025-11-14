import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import {
  LANDING_PAGE,
  CHAT,
  INTEGRATED_CHAT,
  DASHBOARD,
  CUSTOMERS,
  KNOWLEDGE,
  LOGIN_ROUTE,
  SIGNUP_ROUTE,
} from "./constants/routes";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";
import SignupPrompt from "./components/SignupPrompt";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Chat from "./pages/Chat";
import IntegratedChat from "./pages/IntegratedChat";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Knowledge from "./pages/Knowledge";

// Wrapper to show SignupPrompt when needed
const AppWrapper = ({ children }) => {
  const { showSignupPrompt } = useAuth();

  return (
    <>
      {children}
      {showSignupPrompt && <SignupPrompt />}
    </>
  );
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      path="/"
      element={
        <AuthProvider>
          <AppWrapper>
            <Layout />
          </AppWrapper>
        </AuthProvider>
      }
    >
      {/* Public Routes */}
      <Route path={LANDING_PAGE} element={<LandingPage />} />
      <Route path={LOGIN_ROUTE} element={<Login />} />
      <Route path={SIGNUP_ROUTE} element={<Signup />} />

      {/* Chat Routes - Accessible to anonymous users */}
      <Route path={CHAT} element={<IntegratedChat />} />
      <Route path={INTEGRATED_CHAT} element={<IntegratedChat />} />

      {/* Protected Routes - Require authentication */}
      <Route
        path={DASHBOARD}
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path={CUSTOMERS}
        element={
          <ProtectedRoute>
            <Customers />
          </ProtectedRoute>
        }
      />
      <Route
        path={KNOWLEDGE}
        element={
          <ProtectedRoute>
            <Knowledge />
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to landing page */}
      <Route path="*" element={<Navigate to={LANDING_PAGE} replace />} />
    </Route>
  )
);

const Routes = () => {
  return <RouterProvider router={router} />;
};

export default Routes;
