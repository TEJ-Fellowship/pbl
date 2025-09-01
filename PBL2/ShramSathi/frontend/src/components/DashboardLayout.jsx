// import React, { useState } from "react";
// import Navbar from "./Navbar.jsx";
// import Dashboard from "./Dashboard.jsx";
// import logourl from "../assets/projectLogo.png";
// import LandingPage from "../pages/LandingPage.jsx";
// import Taskform from "./Taskform.jsx";
// import Tasks from './Tasks.jsx';
// import Test from "../components/Test.jsx"

// function DashboardLayout({ activeSection, setActiveSection }) {
//   const [showLanding, setShowLanding] = useState(true);
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   return (
//     <>
//       {showLanding ? <LandingPage showLanding={showLanding} setShowLanding={setShowLanding} /> :
//         (<div className="flex h-screen bg-gray-100">
//           <aside className="fixed top-0 left-0 w-64 h-screen bg-white shadow-md flex flex-col">
//             <div className="flex items-center justify-center font-bold border-b">
//               <img src={logourl} className="h-[90px] w-auto" />
//             </div>
//             <Navbar setActiveSection={setActiveSection} setIsModalOpen={setIsModalOpen}/>
//             <div className="mt-auto p-4 border-t">
//               <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
//                 Logout
//               </button>
//             </div>
//           </aside>
//           <div className="flex-1 ml-64 p-6 bg-gray-100 overflow-y-auto">
//             {activeSection === "dashboard" && <Dashboard />}
//             {activeSection === "programs" && <h1>hi program</h1>}
//             {activeSection === "tasks" && <Tasks />}
//             {/* {activeSection === "members" && <h1>hi members</h1>} */}
//             {activeSection === "gemini" && <Test/>}
//             {activeSection === "overview" && <h1>hi overview</h1>}
//           </div>
//         </div>
//       )}
//       {isModalOpen && <Taskform setIsModalOpen = {setIsModalOpen} />}
//     </>
//   );
// }

// export default DashboardLayout;

// import React, { useState } from "react";
// import Navbar from "./Navbar.jsx";
// import Dashboard from "./Dashboard.jsx";
// import logourl from "../assets/projectLogo.png";
// import LandingPage from "../pages/LandingPage.jsx";
// import Test from "./Test.jsx";
// function DashboardLayout({ activeSection, setActiveSection }) {
//   const [showLanding, setShowLanding] = useState(true);

//   // const[showHomePage,setHomePage]= useState(false)

//   return (
//     <>
//       {showLanding ? (
//         <LandingPage
//           showLanding={showLanding}
//           setShowLanding={setShowLanding}
//         />
//       ) : (
//         <div className="flex h-screen bg-gray-100">
//           <aside className="fixed top-0 left-0 w-64 h-screen bg-white shadow-md flex flex-col">
//             <div className="flex items-center justify-center font-bold border-b">

//               <a href="http://localhost:5173">
//                 <img src={logourl} className="h-[90px] w-auto" />
//               </a>

//             </div>
//             <Navbar setActiveSection={setActiveSection} />
//             <div className="mt-auto p-4 border-t">
//               <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
//                 Logout
//               </button>
//             </div>
//           </aside>
//           <div className="flex-1 ml-64 p-6 bg-gray-100 overflow-y-auto">
//             {activeSection === "dashboard" && <Dashboard />}
//             {activeSection === "programs" && <h1>hi program</h1>}
//             {activeSection === "tasks" && <h1>hi tasks</h1>}
//             {activeSection === "gemini" && <Test/>}
//             {activeSection === "overview" && <h1>hi overview</h1>}
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

// export default DashboardLayout;

import React, { useEffect, useState } from "react";
import {Link} from "react-router-dom"
import Navbar from "./Navbar.jsx";
import Dashboard from "./Dashboard.jsx";
import logourl from "../assets/projectLogo.png";
import LandingPage from "../pages/LandingPage.jsx";
import Taskform from "./Taskform.jsx";
import Tasks from "./Tasks.jsx";
import Test from "../components/Test.jsx";

function DashboardLayout({ activeSection, setActiveSection }) {
  const [showLanding, setShowLanding] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  if (!isLoggedIn) {
    return (
      <LandingPage showLanding={showLanding} setShowLanding={setShowLanding} />
    );
  }

  return (
    <>
      {/* {showLanding ? <LandingPage showLanding={showLanding} setShowLanding={setShowLanding} /> */}

      <div className="flex h-screen bg-gray-100">
        <aside className="fixed top-0 left-0 w-64 h-screen bg-white shadow-md flex flex-col">
          <div className="flex items-center justify-center font-bold border-b">
            <img src={logourl} className="h-[90px] w-auto" />
          </div>
          <Navbar
            setActiveSection={setActiveSection}
            setIsModalOpen={setIsModalOpen}
          />

          <div className="mt-auto p-4 border-t">

          <Link to="/">
            <button
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              onClick={() => {
                localStorage.removeItem("token");
                setIsLoggedIn(false);
              }}
            >
              Logout
            </button>
            </Link>
          </div>
        </aside>
        <div className="flex-1 ml-64 p-6 bg-gray-100 overflow-y-auto">
          {activeSection === "dashboard" && <Dashboard />}
          {activeSection === "programs" && <h1>hi program</h1>}
          {activeSection === "tasks" && <Tasks />}
          {/* {activeSection === "members" && <h1>hi members</h1>} */}
          {activeSection === "gemini" && <Test />}
          {activeSection === "overview" && <h1>hi overview</h1>}
        </div>
      </div>

      {isModalOpen && <Taskform setIsModalOpen={setIsModalOpen} />}
    </>
  );
}

export default DashboardLayout;
