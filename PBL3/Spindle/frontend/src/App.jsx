import './App.css'
import SignUp from './pages/SignUp'
import LogIn from './pages/LogIn'
import Dashboard from './pages/dashboard'

import Home from './components/Home'
import MyPolls from './components/MyPolls'
import CreatePoll from './components/CreatePoll'

import LandingPage from './pages/LandingPage'
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

          <Route path="/home" element={<Home/>} />
          <Route path="/myPolls" element={<MyPolls/>} />
          <Route path="/createPoll" element={<CreatePoll/>} />


          
        </Routes>
      </Router>
    </>
  )
}


export default App
