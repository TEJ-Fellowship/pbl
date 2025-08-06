// import Home from "./pages/homepage/Home";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./pages/homepage/Home";
import Quiz from "./pages/Quizpage/Quiz";
import Result from "./pages/resultpage/Result";
import GeminiApi from "./pages/api/GeminiApi";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    // element: < />,
  },
  {
    path: "/quiz",
    element: <Quiz />,
  },
  {
    path: "/result",
    element: <Result />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
