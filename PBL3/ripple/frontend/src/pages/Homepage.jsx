import React from 'react'
import { useNavigate } from 'react-router-dom'

function Homepage() {

  const navigate = useNavigate();

  const handleNavigation = (path)=>{
    navigate(path)
  }

  return (
    <div 
    className="min-h-screen flex items-center justify-center" 
    style={{ backgroundImage: 'radial-gradient(circle, #043317, #072b15, #092412, #081c0f, #05150a, #071004, #070a01, #030300, #030200, #030100, #020000, #000000)' }}
  >
  
      
        <div className='text-center'>
            <div className="flex items-center justify-center mb-6">
            <img src="/logo2.png" alt="logo"  className='h-44'/>
            </div>
        <h2 className='text-text-secondary text-2xl font-semibold mb-3'>Join the Ripple Effect</h2>
        <p className='text-text-secondary mb-12 text-base '>connect with friends and share moments with a single tap.</p>

        {/* buttons */}
        <div className='w-22 pl-2'>
          <button className='bg-primary font-bold border rounded-2xl border-none px-28 py-2 mb-6' onClick={()=>handleNavigation('/SignUp')}>Sign Up</button><br />
          <button className='text-primary font-bold border rounded-2xl px-28 py-2 mb-6 border-primary' onClick={()=>handleNavigation('/LogIn')}>Log In</button>
        </div>

        </div>

    </div>
  )
}

export default Homepage