import React, { useContext } from 'react'
import { ThemeContext } from '../ThemeContext'

function Aboutus() {
  const {isDark} = useContext(ThemeContext)
  return (
    <div className={`min-h-screen ${isDark?'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-900':'bg-gradient-to-br from-pink-200 via-purple-200 to-purple-300'} px-6 py-2`}>
        <div className='max-w-2xl mx-auto'>
            {/* header section */}
            <div className='text-center mb-12'>
                <img 
            src={isDark?'invLogo.png':'/logo.png'}
            alt="logo" 
            className="w-[250px] mx-auto"
          />
                <h1 className={`font-bold font-serif text-5xl ${isDark?'text-gray-300':'text-gray-800'}  tracking-tight`}>About MemoNest</h1>
                <div className="w-48 h-1 bg-gradient-to-r from-pink-400 to-purple-500 mx-auto rounded-full mb-6"></div>
                    <p className={`text-lg ${isDark?'text-gray-300' :'text-gray-700'} max-w-2xl leading-relaxed`}>Memonest is a modern journaling app designed to help you capture your thoughts, track your growth, and preserve memories—all in one secure, easy-to-use space. Whether you're documenting your day, setting goals, or reflecting on your journey, Memonest provides a calm, distraction-free environment to write and grow. With features like customizable entries, mood tracking,and privacy-first design. Memonest is your digital nest for memories and mindfulness.
                    </p>
            </div>

            {/* mission section */}
            <div className='text-center text-gray-700 mb-12 bg-red-100 backdrop-blur-lg rounded-2xl px-4 py-4 shadow-xl border border-white/30'>
                <img 
                src="/working-on-laptop.png"
                alt="laptop"
                className='w-[100px] mx-auto pb-4'
                />
                <h1 className={`text-3xl font-bold ${isDark?'text-gray-800':'text-gray-800'} pb-8`}>Our Mission</h1>
                <p>At Memonest, our mission is to help people reconnect with their thoughts, emotions, and experiences through the simple act of journaling.We believe that self-reflection leads to self-awareness—and that everyone deserves a safe, personal space to grow, heal, and remember.
                Our goal is to make that space beautifully intuitive, private, and empowering for all.</p>
            </div>
        </div>




    </div>
  )
}

export default Aboutus