import React from 'react'

function Aboutus() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-purple-300 px-6 py-2'>
        <div className='max-w-2xl mx-auto'>
            {/* header section */}
            <div className='text-center mb-12'>
                <img 
            src="/logo.png" 
            alt="logo" 
            className="w-[250px] mx-auto"
          />
                <h1 className='font-bold font-serif text-5xl text-gray-800  tracking-tight'>About MemoNest</h1>
                <div className="w-48 h-1 bg-gradient-to-r from-pink-400 to-purple-500 mx-auto rounded-full mb-6"></div>
                    <p className='text-lg text-gray-700 max-w-2xl leading-relaxed'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Perspiciatis distinctio enim in, laudantium dolorum, dicta quisquam illum reprehenderit nostrum eveniet mollitia est commodi! Quis accusantium aliquam animi. Blanditiis facere a animi et.
                    </p>
            </div>

            {/* mission section */}
            <div className='text-center text-gray-700 mb-12 bg-red-100 backdrop-blur-lg rounded-2xl px-4 py-4 shadow-xl border border-white/30'>
                <img 
                src="/working-on-laptop.png"
                alt="laptop"
                className='w-[100px] mx-auto pb-4'
                />
                <h1 className='text-3xl font-bold text-gray-700 pb-8'>Our Mission</h1>
                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Velit magni explicabo, blanditiis praesentium illum veniam quasi magnam sint dolor cum eum non alias, pariatur totam quo adipisci ipsum saepe, tenetur possimus cupiditate?</p>
            </div>
        </div>




    </div>
  )
}

export default Aboutus