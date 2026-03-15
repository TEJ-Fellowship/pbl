import React from 'react'
import HeroSection from '../components/HeroSection'
import Sidebar from '../components/Sidebar'
function Upload() {
  return (
     <div className="min-h-screen flex bg-[#0d0b14]">
      <Sidebar />

      <div className="flex-1 overflow-y-auto p-8 mt-16">
        <HeroSection />
      </div>
    </div>
  )
}

export default Upload