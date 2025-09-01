// import "./App.css";
// import DashboardLayout from "./components/DashboardLayout.jsx";
// import { useState } from "react";
// import "./App.css";

// function App() {
//   const [activeSection, setActiveSection] = useState("dashboard");
//   return (
//     <>
//       <DashboardLayout activeSection={activeSection} setActiveSection={setActiveSection}/>
//     </>
//   );
// }

// export default App;



import "./App.css";
import DashboardLayout from "./components/DashboardLayout.jsx";
import { useState } from "react";
import { Routes,Route } from 'react-router-dom'
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import "./App.css";

function App() {
  const [activeSection, setActiveSection] = useState("dashboard");
  return (
    <>
    <Routes>


    <Route path="/" element={<LandingPage/>}/>
    <Route path="/dashboardpage" element={<DashboardLayout activeSection={activeSection} setActiveSection={setActiveSection}/>}/>

    <Route path="/login" element={<LoginPage />} />
    <Route path="/signUp" element={<SignUpPage />} />

    </Routes>
      
    </>
  );
}

export default App;
