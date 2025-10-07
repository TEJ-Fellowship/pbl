import React, { useState } from 'react'
import {Link, useNavigate} from 'react-router-dom'

const LogIn = () => {
    const [password, setPassword] = useState('')
    const [email, setEmail] = useState('')
    const [isShown, setIsShown] = useState(false)
    const navigate = useNavigate();
    const url = "http://localhost:5000";

      
      const handleLogin = (e)=>{
        e.preventDefault();
        const loginDetails = {email, password}
          fetch(`${url}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type':'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(loginDetails)
        })
        .then((response)=>{
          if(!response.ok){
            throw new Error('Login Failed')
          }
          return response.json()
        })
        .then((data)=>{
          console.log('login data ',data)
          navigate('/Dashboard')
        })
        .catch((error)=>{
          console.error('Login Failed', error)
          alert('wrong credentials')
        })
      }

    
  return (
    <div className='min-h-screen flex items-center justify-center px-4'
    style={{
        backgroundImage: 'radial-gradient(circle, #043317, #072b15, #092412, #081c0f, #05150a, #071004, #070a01, #030300, #030200, #030100, #020000, #000000)'
    }}>
         <div className="w-full max-w-md bg-black/50 border border-secondary rounded-xl p-12 shadow-2xl backdrop-blur-md">
         <div className="mx-auto flex items-center justify-center mb-6">
            <img src="logo2.png" alt="logo" className="h-20" />
        </div>

        <h2 className="text-center text-xl font-semibold mb-6 text-white">Welcome Back</h2>
         {/* Form */}
         <form className="flex flex-col gap-4" onSubmit={handleLogin}>
          <input
            type="email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-3 rounded-md bg-transparent border border-secondary text-text-secondary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className='mb-4 relative'>
          <input
            type={isShown? 'text':'password'}
            value = {password}
            placeholder="Password"
            onChange={(e)=>setPassword(e.target.value)}
            className="w-full px-4 py-3 pr-16 rounded-md bg-transparent border border-secondary text-text-secondary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <img
          src = {isShown?'/openEye.png':'/closeEye.png'}
          alt='toggle password visibility'
          
          onClick={()=> setIsShown(!isShown)}
           className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded" />
          </div>
          <button
            type="submit"
            className="bg-primary text-text-primary font-semibold py-3 rounded-md hover:bg-accent transition"
          >
            Log In
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-text-secondary">
          Don't have an account?{' '}
          
          <span className="text-primary font-semibold hover:underline">
          <Link
          to="/SignUP">
            Sign Up
          </Link>
          </span>
        </p>
        </div>
    </div>
  )
}

export default LogIn