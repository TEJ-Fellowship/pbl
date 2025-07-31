
import './App.css'
import Navbar from "./Navbar.jsx";
import Dashboard from "./components/Dashboard";
function App() {

  return (
    <>
      <body>
      <Navbar/>
      </body>
      
      
     
      <div style={{  width: "100vw" ,height:"100vh"}}>
        <Dashboard/>
      </div>
    </>
  );
}

export default App;
