import React from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Footer from '../components/Footer'
function LandingPage({showDashboard,setShowDashboard}) {

  return (
    <>
   
        <Navbar/>
        <Hero showDashboard={showDashboard} setShowDashboard={setShowDashboard}/>
        <Footer/>
    </>
  )
}

export default LandingPage
