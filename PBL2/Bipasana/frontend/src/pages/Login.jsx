import React, { useState } from 'react';
import axios from 'axios'
import {Link} from 'react-router-dom'

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isShown,setIsShown] = useState(false)

  const handlerFunc=()=>{
    setIsShown(!isShown)        
  }

  const handleLogin = () =>{
    const loginData = {email, password}
    axios.post('http://localhost:3001/api/user', loginData)
    .then(response=>console.log("login successful",response.data))
    .catch((error)=>console.error('something went wrong',error))
  }

  return (
    <div 
    className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url("/notemain2.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      
      <div className="w-full max-w-md">
        <div 
          className="backdrop-blur-md bg-white/20 rounded-[50px] p-8 shadow-2xl border border-white/30"
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(15px)',
            WebkitBackdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          {/* Login Title with Logo */}
          <div className="flex items-center">
            <div className="w-[100px] h-[100px] bg-contain bg-no-repeat bg-center"
            style={{
              backgroundImage: 'url("/logo.png")',
            }}>
            </div>
            <h1 className="text-2xl font-bold text-black">LOGIN</h1>
          </div>
          
          {/* Email Input */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Email or username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/30 placeholder-gray-600 text-black border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
              style={{
                background: 'rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              }}
            />
          </div>
          
          {/* Password Input */}
          <div className="mb-4 relative">
            <input
              type={isShown?'text':"password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/30 backdrop-blur-sm placeholder-gray-600 text-black border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
              style={{
                background: 'rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              }}
            />
            <img
              src={isShown ? "/view.png" : "/close-eye.png"}
              alt="Toggle Password Visibility"
              onClick={handlerFunc}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 cursor-pointer"
            />
              
          </div>
          
          {/* Forgot Password */}
          <div className="text-right mb-6">
            <a href="#" className="text-sm text-gray-600 hover:text-gray-800">
              Forgot password?
            </a>
          </div>
          
          
          {/* Login Button */}
          <button className="w-full py-3 mb-6 bg-[#BF40BF] hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors" onClick={handleLogin}>
            Login
          </button>
          {/* OR Divider */}
          <div className='mb-4'>
            <span>Don't have an account?</span>
            <Link to='/signup' className='text-purple-700 '>Sign-up here</Link>
          </div>

          <div className="text-center mb-6">
            <span className="text-black font-medium">OR</span>
            <p className="text-black font-medium">sign in with</p>
          </div>
          
          {/* Social Login Buttons */}
          <div className="flex justify-center space-x-4">
            {/* Google */}
            <button className="w-12 h-12 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:scale-110 transition-transform hover:shadow-md">
            <svg className="w-6 h-6" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M533.5 278.4c0-17.4-1.4-34.1-4.1-50.4H272v95.3h146.9c-6.3 33.7-25.3 62.3-53.9 81.5v67.5h87.2c51-47 81.3-116.2 81.3-193.9z"/>
              <path fill="#34A853" d="M272 544.3c72.6 0 133.7-24.1 178.3-65.4l-87.2-67.5c-24.2 16.3-55.1 26-91.1 26-70.1 0-129.4-47.3-150.7-110.8H32.8v69.5c44.9 88.5 137.5 147.7 239.2 147.7z"/>
              <path fill="#FBBC04" d="M121.3 326.6c-10.4-30.7-10.4-63.9 0-94.6v-69.5H32.8c-29.1 58.1-29.1 126.1 0 184.2l88.5-20.1z"/>
              <path fill="#EA4335" d="M272 107.3c39.5-.6 77.5 13.5 106.5 39.8l79.6-79.6C413.4 23.9 344.6-1.4 272 0 170.3 0 77.7 59.2 32.8 147.7l88.5 69.5c21.3-63.5 80.6-110.8 150.7-110.8z"/>
            </svg>
          </button>
            
            {/* Facebook */}

            <a
            href='https://www.facebook.com/'
            target='_blank'
            rel = 'noopener noreferrer'
            className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center hover:scale-110 transition-transform hover:bg-blue-700">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>              
            </a>
            
            {/* Twitter/X */}
            <button className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center hover:scale-110 transition-transform hover:bg-blue-500">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;