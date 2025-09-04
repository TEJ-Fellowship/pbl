import { BrowserRouter, Routes, Route, Link } from "react-router-dom"
import Homepage from "./pages/Homepage"
import LogIn from "./pages/LogIn"
import SignUp from "./pages/SignUp"

function App() {
  

  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Homepage />} />
        <Route path='/LogIn' element={<LogIn />} />
        <Route path='/SignUp' element={<SignUp />} />
      </Routes>
    </BrowserRouter>
      
    </>
  )
}

export default App
