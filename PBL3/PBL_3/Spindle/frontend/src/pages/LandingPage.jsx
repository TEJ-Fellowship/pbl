import React from 'react'
import { useNavigate } from "react-router-dom"
import img from '../assets/h.png'
import lo from '../assets/logo.png'
import Hero from '../components/Hero';
import Footer from '../components/Footer';


function App() {
 const navigate = useNavigate();
 return (
    <div className="bg-[#FFFBF8] min-h-screen font-sans text-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <div className="flex items-center">

          <img src={lo} alt="logo" className="w-12 sm:w-16 md:w-20 h-auto" />

            <span className="font-bold text-2xl sm:text-3xl text-red-600">Quick<span className="text-gray-900">Pick</span></span>
          </div>

          {/* <nav className="flex flex-col sm:flex-row items-center sm:space-x-6 space-y-2 sm:space-y-0">
            <a href="#" className="text-gray-600 hover:text-gray-900">room</a>
            <a href="#" className="text-gray-600 hover:text-gray-900">players</a>
            <a href="#" className="text-gray-600 hover:text-gray-900">watch</a>
          </nav> */}

          <div className="flex items-center space-x-4">
            <button onClick ={()=> navigate("/login")}className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg text-sm sm:text-base">
              Log in
            </button>
            <button onClick ={()=> navigate("/signUP")} className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg shadow-sm text-sm sm:text-base">
              Sign up
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="mt-10 sm:mt-16 lg:mt-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Column */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
                Make group decisions, fast.
              </h1>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-600 max-w-md sm:max-w-lg mx-auto lg:mx-0">
                QuickPick is the fastest way to make group decisions. Create a poll,see the results in real-time.
              </p>
              <div className="mt-6 sm:mt-8">
                <button  onClick={()=>navigate("/signUp") }className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg shadow-md transition-transform transform hover:scale-105">
                  Get started for free
                </button>
              </div>
            </div>
            <div className="hidden lg:block">
                <img src={img} alt="Illustration" className="w-full h-auto" />
            </div>

          </div>
        </main>


<Hero/>
<Footer/>




      </div>
    </div>
  )
}

export default App
