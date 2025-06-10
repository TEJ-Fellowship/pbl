import React from 'react'

const WeatherNavigation = () => {
  return (
    <>
    <div className="absolute bottom-0 left-0 w-full flex justify-around text-white text-sm cursor-pointer">
        <span className="py-2 border-b-2 border-yellow-400 hover:opacity-100 transition-all duration-300">WEATHER</span>
        <span className="py-2 opacity-60 hover:opacity-100 transition-all duration-300">NEWS &amp; EVENTS</span>
        <span className="py-2 opacity-60 hover:opacity-100 transition-all duration-300">GALLERY (30)</span>
    </div>
  </>
  )
}

export default WeatherNavigation