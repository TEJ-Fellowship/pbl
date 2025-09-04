import './App.css'
import SignUp from './components/SignUp'
import LogIn from './components/LogIn'
import Dashboard from './components/Dashboard'
import LandingPage from './components/LandingPage'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage/>} />
          <Route path="/signUp" element={<SignUp/>} />
          <Route path="/login" element={<LogIn/>} />
          <Route path="/dashboard" element={<Dashboard/>} />

        </Routes>
      </Router>
    </>
  )
}


export default App
