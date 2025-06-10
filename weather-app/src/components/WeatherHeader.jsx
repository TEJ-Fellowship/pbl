import React from 'react'

const WeatherHeader = () => {
  return (
    <>
    <div className="absolute top-6 left-8 text-white">
        <h1 className="text-3xl font-light">
          Buch<span className="font-bold">arest</span>, RO
        </h1>
      </div> 
      <div className="absolute top-6 right-8 text-white flex flex-col items-end">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3"
            />
            <circle
              cx={12}
              cy={12}
              r={10}
              stroke="currentColor"
              strokeWidth={2}
              fill="none"
            />
          </svg>
          <span className="text-xs">FLORIDA, USA</span>
        </div>
        <span className="text-lg font-semibold">20:15 pm</span>
      </div> 
      </>
  )
}

export default WeatherHeader