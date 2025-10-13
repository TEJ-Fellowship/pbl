import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { LANDING_PAGE, CHAT } from "./constants/routes";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import Chat from "./pages/Chat";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route path={LANDING_PAGE} element={<LandingPage />} />
      <Route path={CHAT} element={<Chat />} />
      <Route path="*" element={<Navigate to={LANDING_PAGE} replace />} />
    </Route>
  )
);

const Routes = () => {
  return <RouterProvider router={router} />;
};

export default Routes;
