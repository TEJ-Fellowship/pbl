import './App.css'
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx';
import Signup from './pages/Signup.jsx';
import Homepage from './pages/Homepage.jsx';
import Layout from './Layout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import Account from './pages/Account.jsx';

function App() {
  const [isLoggedIn,setIsLoggedIn] = useState(false)
  
  return (
    <>
    {/* <h1>hello memoNest </h1>
    <Login /> */}

    <BrowserRouter>
    <Routes>
      <Route path='/' element = {<Layout />}>
        <Route index element = {
          isLoggedIn?
          <Dashboard />:
          <Homepage />
    
        } />
        <Route path = "login" element= {<Login />} />
        <Route path = "signup" element= {<Signup />} />
        <Route path = "account" element= {<ProtectedRoute isLoggedIn={isLoggedIn} >
          <Account />
        </ProtectedRoute>} />
      </Route>
      

    </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
