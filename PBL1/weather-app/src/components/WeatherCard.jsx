import React from 'react'

const WeatherCard = ({children}) => {
  return (
   <div className="w-[800px] rounded-2xl shadow-2xl bg-white/30 backdrop-blur-md overflow-hidden">

    <div>{children}</div>
    </div>

  )
}

export default WeatherCard