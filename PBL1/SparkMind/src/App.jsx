// import Home from "./pages/homepage/Home";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./pages/homepage/Home";
import Quiz from "./pages/Quizpage/Quiz";
import Result from "./pages/resultpage/Result";
const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
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
