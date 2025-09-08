// // import React, { useState } from "react"
// // import {Link} from "react-router-dom";

// // function Dashboard() {
// //   const [question, setQuestion] = useState("")
// //   const [options, setOptions] = useState(["", ""])
// //   const [timer, setTimer] = useState("No timer")

// //   const handleOptionChange = (index, value) => {
// //     const newOptions = [...options]
// //     newOptions[index] = value
// //     setOptions(newOptions)
// //   }

// //   const addOption = () => {
// //     setOptions([...options, ""])
// //   }

// //   const removeOption = (index) => {
// //     if (options.length > 2) {
// //       setOptions(options.filter((_, i) => i !== index))
// //     }
// //   }

// //   const handleSubmit = (e) => {
// //     e.preventDefault()
// //     console.log({ question, options, timer })
// //     alert("Poll created successfully!")
// //   }

// //   return (
// //     <div className="min-h-screen bg-white flex flex-col">
// //       {/* Navbar */}
// //       <nav className="flex justify-between items-center px-6 py-4 border-b">
// //         <div className="flex items-center gap-8">
// //           <span className="text-xl font-bold text-red-500">Spindle</span>

// //           <ul className="flex gap-6 text-gray-700 font-medium">

// //             <Link to="/home"><li className="cursor-pointer hover:text-red-500">Home</li></Link>
// //             <Link to="/myPolls"><li className="cursor-pointer hover:text-red-500">My Polls</li></Link>
// //             <Link to="/createPoll"><li className="cursor-pointer hover:text-red-500">Create poll</li></Link>
// //           </ul>

// //         </div>
// //         <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500 text-white font-bold cursor-pointer">
// //           AL
// //         </div>
// //       </nav>

// //     </div>
// //   )
// // }

// // export default Dashboard

// // import React, { useState } from "react";
// // import Navbar from "./Navbar.jsx";
// // import Dashboard from "./Dashboard.jsx";
// // import logourl from "../assets/projectLogo.png";
// // import LandingPage from "../pages/LandingPage.jsx";
// // import Taskform from "./Taskform.jsx";
// // import Tasks from './Tasks.jsx';
// // import Test from "../components/Test.jsx"

// // function DashboardLayout({ activeSection, setActiveSection }) {
// //   const [showLanding, setShowLanding] = useState(true);
// //   const [isModalOpen, setIsModalOpen] = useState(false);

// //   return (
// //     <>
// //       {showLanding ? <LandingPage showLanding={showLanding} setShowLanding={setShowLanding} /> :
// //         (<div className="flex h-screen bg-gray-100">
// //           <aside className="fixed top-0 left-0 w-64 h-screen bg-white shadow-md flex flex-col">
// //             <div className="flex items-center justify-center font-bold border-b">
// //               <img src={logourl} className="h-[90px] w-auto" />
// //             </div>
// //             <Navbar setActiveSection={setActiveSection} setIsModalOpen={setIsModalOpen}/>
// //             <div className="mt-auto p-4 border-t">
// //               <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
// //                 Logout
// //               </button>
// //             </div>
// //           </aside>
// //           <div className="flex-1 ml-64 p-6 bg-gray-100 overflow-y-auto">
// //             {activeSection === "dashboard" && <Dashboard />}
// //             {activeSection === "programs" && <h1>hi program</h1>}
// //             {activeSection === "tasks" && <Tasks />}
// //             {/* {activeSection === "members" && <h1>hi members</h1>} */}
// //             {activeSection === "gemini" && <Test/>}
// //             {activeSection === "overview" && <h1>hi overview</h1>}
// //           </div>
// //         </div>
// //       )}
// //       {isModalOpen && <Taskform setIsModalOpen = {setIsModalOpen} />}
// //     </>
// //   );
// // }

// // export default DashboardLayout;

// // import React, { useState } from "react";
// // import Navbar from "./Navbar.jsx";
// // import Dashboard from "./Dashboard.jsx";
// // import logourl from "../assets/projectLogo.png";
// // import LandingPage from "../pages/LandingPage.jsx";
// // import Test from "./Test.jsx";
// // function DashboardLayout({ activeSection, setActiveSection }) {
// //   const [showLanding, setShowLanding] = useState(true);

// //   // const[showHomePage,setHomePage]= useState(false)

// //   return (
// //     <>
// //       {showLanding ? (
// //         <LandingPage
// //           showLanding={showLanding}
// //           setShowLanding={setShowLanding}
// //         />
// //       ) : (
// //         <div className="flex h-screen bg-gray-100">
// //           <aside className="fixed top-0 left-0 w-64 h-screen bg-white shadow-md flex flex-col">
// //             <div className="flex items-center justify-center font-bold border-b">

// //               <a href="http://localhost:5173">
// //                 <img src={logourl} className="h-[90px] w-auto" />
// //               </a>

// //             </div>
// //             <Navbar setActiveSection={setActiveSection} />
// //             <div className="mt-auto p-4 border-t">
// //               <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
// //                 Logout
// //               </button>
// //             </div>
// //           </aside>
// //           <div className="flex-1 ml-64 p-6 bg-gray-100 overflow-y-auto">
// //             {activeSection === "dashboard" && <Dashboard />}
// //             {activeSection === "programs" && <h1>hi program</h1>}
// //             {activeSection === "tasks" && <h1>hi tasks</h1>}
// //             {activeSection === "gemini" && <Test/>}
// //             {activeSection === "overview" && <h1>hi overview</h1>}
// //           </div>
// //         </div>
// //       )}
// //     </>
// //   );
// // }

// // export default DashboardLayout;

// import React, { useState } from "react";

// function Dashboard() {
//   const [activeSection, setActiveSection] = useState("home");

//   return (
//     <div className="flex">
//       {/* Sidebar */}
//       <aside className="w-64 h-screen bg-white shadow-lg p-6 space-y-6 flex flex-col fixed left-0 top-0">
//         <h1 className="text-2xl font-bold text-red-600">Spindle</h1>
//         <nav className="space-y-2 flex-1">
//           <button
//             onClick={() => setActiveSection("home")}
//             className="w-full text-left px-4 py-2 rounded-lg hover:bg-red-600 hover:text-white"
//           >
//             🏠 Home
//           </button>
//           <button
//             onClick={() => setActiveSection("createpolls")}
//             className="w-full text-left px-4 py-2 rounded-lg hover:bg-red-600 hover:text-white"
//           >
//             ➕ Create Polls
//           </button>
//           <button
//             onClick={() => setActiveSection("mypolls")}
//             className="w-full text-left px-4 py-2 rounded-lg hover:bg-red-600 hover:text-white"
//           >
//             📊 My Polls
//           </button>
//         </nav>
//       </aside>

//       {/* Main content */}
//       <div className="flex-1 ml-64 p-6 bg-gray-100 overflow-y-auto min-h-screen">
//         {activeSection === "home" && <h1 className="text-black">hi home</h1>}
//         {activeSection === "mypolls" && <h1>hi my polls</h1>}
//         {activeSection === "createpolls" && <h1>hi create polls</h1>}
//       </div>
//     </div>
//   );
// }

// export default Dashboard;





import React, { useState } from "react";
import Home from "../components/Home";
import MyPolls from "../components/MyPolls";
import CreatePoll from "../components/CreatePoll";
function Dashboard() {
  const [activeSection, setActiveSection] = useState("home");

  return (
    <div className="flex">
      {/* Sidebar */}
      <aside className="w-64 h-screen bg-white shadow-lg p-6 space-y-6 flex flex-col fixed left-0 top-0">
        <h1 className="text-2xl font-bold text-red-600">Spindle</h1>
        <nav className="space-y-2 flex-1">
          <button
            onClick={() => setActiveSection("home")}
            className={`w-full text-left px-4 py-2 rounded-lg ${
              activeSection === "home"
                ? "bg-red-600 text-white"
                : "hover:bg-red-600 hover:text-white"
            }`}
          >
            🏠 Home
          </button>



          <button
            onClick={() => setActiveSection("mypolls")}
            className={`w-full text-left px-4 py-2 rounded-lg ${
              activeSection === "mypolls"
                ? "bg-red-600 text-white"
                : "hover:bg-red-600 hover:text-white"
            }`}
          >
            📊 My Polls
          </button>







          <button
            onClick={() => setActiveSection("createpolls")}
            className={`w-full text-left px-4 py-2 rounded-lg ${
              activeSection === "createpolls"
                ? "bg-red-600 text-white"
                : "hover:bg-red-600 hover:text-white"
            }`}
          >
            ➕ Create Polls
          </button>
         
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-64 p-6 bg-gray-100 overflow-y-auto min-h-screen">
        {activeSection === "home" && <Home/>}
        {activeSection === "mypolls" && <MyPolls/>}
        {activeSection === "createpolls" && <CreatePoll/>}
      </div>
    </div>
  );
}

export default Dashboard;
