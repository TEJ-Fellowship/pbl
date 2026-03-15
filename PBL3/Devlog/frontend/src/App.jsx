import './App.css'
import React,{useState} from "react";
import Navbar from './components/Navbar'
import LogForm from './components/LogForm'
import LogList from './components/LogList'
import Github from './components/Github';
import SyncGithub from './components/SyncGithub';


function App() {
  const[activeSection,setActiveSection] = useState("logs")

  //to track the logs
  const [logs,setLogs] = useState([])

  const [repos, setRepos] = useState([]);


  function addLog(log){
    setLogs([...logs,log])
  }
 

  const[search,setSearch] = useState("")

  return (
    <>
      <Navbar setActiveSection={setActiveSection} logs={logs} repos={repos} setRepos={setRepos}/>

      <div>
      {activeSection === "logs" && <LogList
      logs={logs} search={search} setSearch={setSearch}
      repos={repos}
      setRepos={setRepos}
       />}
        {activeSection === "addLogs" && <LogForm 
        onAddLog={addLog}

        />}
        {activeSection === "syncGithub" && <SyncGithub  repos={repos} setRepos={setRepos}/>}
      </div>


{/* 
      {showLogsList ? <LogList logs={logs}
      search={search}
      setSearch={setSearch}
  
        
      /> : <LogForm onAddLog={addLog}/>} */}




      {/* <Test/> */}
    
    </>
  )
}

export default App
