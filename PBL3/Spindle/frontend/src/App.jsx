import './App.css'
import SignUp from './pages/SignUp'
import LogIn from './pages/LogIn'
import Dashboard from './pages/dashboard'
import LandingPage from './pages/LandingPage'
import PollResult from './components/PollResult'
import MyPolls from './components/MyPolls'
import { BrowserRouter as Router, Route, Routes,Navigate } from 'react-router-dom'
function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage/>} />
          <Route path="/signUp" element={<SignUp/>} />
          <Route path="/login" element={<LogIn/>} />
          <Route path="/dashboard/*" element={<Dashboard/>}/>
          <Route path="/dashboard/results" element={<MyPolls/>}/>
        </Routes>
      </Router>
    </>
  )
}


export default App
