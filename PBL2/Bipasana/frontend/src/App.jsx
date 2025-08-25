import './App.css'
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx';
import Signup from './pages/Signup.jsx';
import Homepage from './pages/Homepage.jsx';
import Quotes from './pages/Quotes.jsx';
import Layout from './Layout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import Account from './pages/Account.jsx';

function App() {
  const [isLoggedIn,setIsLoggedIn] = useState(true)
  
  return (
    <>

    <BrowserRouter>
    <Routes>
      <Route path='/' element = {<Layout setIsLoggedIn={setIsLoggedIn} isLoggedIn={isLoggedIn} />}>
        <Route index element = {
          isLoggedIn?
          <Dashboard />:
          <Homepage />
    
        } />
        {/* <Route path = "homepage" element= {<Homepage />} /> */}
        <Route path = "homepage" element= {<Homepage />} />
        <Route path = "login" element= {<Login />} />
        <Route path = "signup" element= {<Signup />} />
        <Route path = "Quotes" element= {<Quotes />} />
        <Route path = "account" element= {<ProtectedRoute  isLoggedIn={isLoggedIn} >
          <Account />
        </ProtectedRoute>} />
      </Route>
    </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
