import React from 'react'
import ReactDOM from 'react-dom/client'
import Navbar from './Components/Navbar/Navbar'
import Recipeformpage from './Components/Recipe-form-page/Recipeformpage'
import "./index.css"
import HomePage from './Components/Home-page/HomePage.jsx'
import Explore from './Components/Explore/Explore.jsx'
import Favorite from './Components/Favorite/Favorite.jsx'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

const App = () => {
  return (
    <>
      <Router>
        <div className='navbar'>
          <Navbar />
        </div>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/add-recipe' element={<Recipeformpage />} />
          <Route path='/explore' element= {<Explore />} />
          <Route path='/favorite' element={<Favorite />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
