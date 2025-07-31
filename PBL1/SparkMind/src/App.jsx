// import Home from "./pages/homepage/Home";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./pages/homepage/Home";
import Quiz from "./pages/Quizpage/Quiz";


const router = createBrowserRouter([
  {
    path : "/",
    element : <Home/>
  },
  {
    path : "/quiz",
    element : <Quiz/>
  },
])

function App(){
  return <RouterProvider router = {router}/>
}

export default App;