import React from 'react'
import LogCard from './LogCard'
import AI from './AI';
function LogList({logs,search,setSearch,techStack, setTechStack,repos}) {
// console.log(logs)
const  filtered=logs.filter((log)=>
    Array.isArray(log.techStack) &&
    log.techStack.some(tech=>
    tech.toLowerCase().includes(search.toLowerCase())
));

    



  return (
    <>


    <div className="flex justify-end max-w-screen-xl mx-auto p-4">
  <input
    type="text"
    placeholder="Filter by tech stack"
    className="w-56 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    value={search}
    onChange={(e)=> {
    setSearch(e.target.value)

    }}
  />
</div>




    <div className="max-w-screen-xl mx-auto mt-8 space-y-4">
    {logs.length === 0 ? (
      <p className="text-center text-gray-500">No logs yet.</p>)



      : filtered.length ===0 && search ?  (
      <p>No logs match your filter</p>)
      :
     
      (search ? filtered : logs).map((log) => <LogCard key={log.id} log={log} 
        techStack={techStack}
        setTechStack={setTechStack}
      />)
     
    }
  </div>


  <AI logs={logs} repos={repos}/>


  



  </>
  )
}

export default LogList
