import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
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
import MainLayout from "./layouts/MainLayout";

const Routes = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route element={<MainLayout />}>
        <Route element={<AuthLayout />}>
          <Route index element={<LearningPortal />} />
          <Route path={HOME_ROUTE} element={<LearningPortal />} />
          <Route path={AI_CHAT} element={<AiChat />} />
          <Route path={SMART_QUIZZES} element={<SmartQuizzes />} />
          <Route path={TRACK_PROGRESS} element={<TrackProgress />} />
        </Route>
        <Route path={LOGIN_ROUTE} element={<LoginRegister />} />
      </Route>
    )
  );
  return <RouterProvider router={router} />;
};

export default Routes;
