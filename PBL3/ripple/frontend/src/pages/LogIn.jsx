import React, { useState } from 'react'

const LogIn = () => {
    const [password, setPassword] = useState('')
    const [isShown, setIsShown] = useState(false)

    const handlerFunc = (e)=>{
        e.preventDefault();
        setIsShown(!isShown)
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
         <form className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username or Email"
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
          <button
          type='button'
           onClick={handlerFunc} 
           className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white bg-primary px-2 py-1 rounded">{isShown?'hide':'show'}</button>
          </div>
          <button
            type="submit"
            className="bg-primary text-text-primary font-semibold py-3 rounded-md hover:bg-accent transition"
          >
            Login
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-text-secondary">
          Don't have an account?{' '}
          <a href="#" className="text-primary font-semibold hover:underline">
            Sign Up
          </a>
        </p>
        </div>
    </div>
  )
}

export default LogIn