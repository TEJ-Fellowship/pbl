import './App.css'

import ManageProperty from './pages/ManageProperty'
import Navbar from './components/Navbar/Navbar'
import SearchPage from './pages/Search/SearchPage'

function App() {

  return (
    <>
      <Navbar />
      <ManageProperty />
      <SearchPage />
    </>
  )
}

export default App
