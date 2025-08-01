import React from 'react'
import ReactDOM from 'react-dom/client'
import Navbar from './Components/Navbar/Navbar'
import Recipeformpage from './Components/Recipe-form-page/Recipeformpage'
import "./index.css"



const App = () => {
  return (
    <>
    <div className='navbar'>
      <Navbar/>
      <Recipeformpage/>
    </div>
    </>
  )
}

export default App
