import React from 'react'
import Hero from '../components/Hero'
import LandingNavbar from '../components/LandingNavbar'
import Footer from '../components/Footer'
function LandingPage({showLanding,setShowLanding}) {

  return (
    <>
   
        <LandingNavbar/>
        <Hero setShowLanding={setShowLanding} showLanding={showLanding}/>
        <Footer/>
    </>
  )
}

export default LandingPage
