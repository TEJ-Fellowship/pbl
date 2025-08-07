import './navbar.css'

function Navbar({setShowDashboard}) {
     const handleStart = () => {
    
    setShowDashboard(true);
  } 

    return (
        <div>
            <div className="body">
            <div className="Nav">
            <a>Home</a>
            <a>Goal</a>
            <a>Contact</a>
            <a>About Us</a>
            </div>
            <h1 id="title">AimEZ</h1>
            <h3>*Your friendly app for goal tracking*</h3>
            <button onClick ={handleStart} className='let'>Let's get Started</button>
            </div>
         </div>
        
        
    )
}

export default Navbar