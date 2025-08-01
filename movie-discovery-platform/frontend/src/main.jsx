import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import StarRating from './components/UI/StarRating'
// import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    {/* <StarRating maxRating={5} message={["Terrible", "Bad","Good","Nice","Amazing" ]}/> */}
    {/* <StarRating maxRating={10} color='blue'/> */}
    {/* <StarRating color='red'/> */}
  </StrictMode>,
)
