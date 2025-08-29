import './App.css'
import Navbar from './components/Navbar'
import { useLocation, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Footer from './components/Footer'

const App = () => {

  const isOwnerPath = useLocation().pathname.includes('owner')
  return (
    <>
     {!isOwnerPath && <Navbar />}
     <div className='min-h-[70vh]'>
      <Routes>
        <Route path='/' element={<Home />} />
      </Routes>
     </div>
     <Footer />
    </>
  )
}

export default App
