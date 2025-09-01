import React, { useContext } from 'react';
import { ThemeContext } from '../ThemeContext';

function Card({ img, text, time }) {
  const { isDark } = useContext(ThemeContext);
  
  return (
    <div className={`rounded-lg p-6 shadow-sm shadow-lg transition-all duration-300 hover:-translate-y-1 ${
      isDark 
        ? 'bg-gray-800 hover:shadow-gray-600/50 hover:shadow-lg' 
        : 'bg-white hover:shadow-color-glow'
    }`}>
      <div className={`w-full h-40 rounded-lg mb-4 flex items-center justify-center ${
        isDark ? 'bg-gray-700' : 'bg-[#e7beef]'
      }`}>
        <img src={img} alt="images" className="h-28 w-28 object-contain"/>
      </div>
      <h3 className={`font-semibold mb-2 ${
        isDark ? 'text-white' : 'text-[#212121]'
      }`}>
        {text}
      </h3>
      <p className={`text-sm ${
        isDark ? 'text-gray-400' : 'text-[#555555]'
      }`}>
        {time}
      </p>
    </div>
  );
}

export default Card;