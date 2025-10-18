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
  DASHBOARD,
  CUSTOMERS,
  KNOWLEDGE,
} from "./constants/routes";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Knowledge from "./pages/Knowledge";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route path={LANDING_PAGE} element={<LandingPage />} />
      <Route path={CHAT} element={<Chat />} />
      <Route path={DASHBOARD} element={<Dashboard />} />
      <Route path={CUSTOMERS} element={<Customers />} />
      <Route path={KNOWLEDGE} element={<Knowledge />} />
      <Route path="*" element={<Navigate to={LANDING_PAGE} replace />} />
    </Route>
  )
);

const Routes = () => {
  return <RouterProvider router={router} />;
};

export default Routes;
