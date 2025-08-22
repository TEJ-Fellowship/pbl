import React from 'react'



function Card({img, text, time}) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-color-glow shadow-lg transition-shadow duration-300 hover:-translate-y-1">
      <div className="w-full h-40 bg-[#e7beef] rounded-lg mb-4 flex items-center justify-center">
        <img src={img} alt="images" className="h-28 w-28 object-contain"/>
       </div>
      <h3 className="font-semibold text-[#212121] mb-2">
        {text}
      </h3>
      <p className="text-[#555555] text-sm">{time}</p>
    </div>
  )
}

export default Card


