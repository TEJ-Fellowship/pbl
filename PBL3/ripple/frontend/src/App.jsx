
import { BrowserRouter, Routes, Route, Link } from "react-router-dom"
import Homepage from "./pages/Homepage"
import LogIn from "./pages/LogIn"
import SignUp from "./pages/SignUp"
import Dashboard from "./pages/Dashboard"
import Ripple from "./pages/Ripple";


function App() {
  return (
    <>

    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Homepage />} />
        <Route path='/LogIn' element={<LogIn />} />
        <Route path='/SignUp' element={<SignUp />} />
        <Route path='/Dashboard' element={<Dashboard />} />
        <Route path="/ripple" element={<Ripple />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
