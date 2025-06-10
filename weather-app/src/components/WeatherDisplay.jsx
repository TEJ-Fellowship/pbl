import React from 'react'

const WeatherDisplay = () => {
  return (
    <div className="flex-1 flex flex-col items-center">
      <div className="flex items-center gap-4">
        <span className="text-6xl font-bold text-gray-800">82°</span>
      </div>
      <span className="text-gray-600 mt-2">
        MONDAY 27<sup>th</sup>
      </span>
    </div>
  )
}

export default WeatherDisplay