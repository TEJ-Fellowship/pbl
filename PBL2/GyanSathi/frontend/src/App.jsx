import './App.css'
import Navbar from './conpoment/Navbar'
import Homepage from './pages/Homepage'
import CourseManagement from './pages/CourseManagement'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

// import { useState } from 'react'

function App() {

  return (
    <>
      <BrowserRouter>
        <Navbar />

          <Routes>
          <Route path='/' element={<Homepage />} />
          <Route path='/my-courses' element={<CourseManagement />} />

          </Routes>
      </BrowserRouter>

    </>
  )
}

export default App
