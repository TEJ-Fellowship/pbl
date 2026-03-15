function LogCard({ log }) {
//  console.log(log)
    return (
      <div className="bg-white p-4 rounded-lg shadow border border-gray-300">


        <h3 className="text-lg font-semibold">{log.projectName}</h3>
        <p className="mt-1 text-gray-700">{log.description}</p>


        <p className="mt-2 text-sm text-gray-500">
          {/* Tech Stack: <button className="capitalize">{log.techStack || "N/A"}</button> */}
techstack:
{log.techStack.map((t,index)=>
    (<button
    key={index}
  className="
    capitalize
    border
    border-blue-500
    text-blue-600
    ml-2
    px-2
    py-1
    rounded-md
    text-sm
    font-medium
    hover:bg-blue-100
    transition
    duration-200
    focus:outline-none
    focus:ring-2
    focus:ring-blue-400
  "
>
  {t}
</button>)
)}



  

        </p>



        <p className="text-sm text-gray-500">
          Time Spent: {log.time} hours
        </p>
        <p className="text-sm text-gray-500">
          Date: {log.date}
          {log.milestone && (
            <span className="ml-2 px-2 py-0.5 bg-yellow-300 text-yellow-900 rounded text-xs font-semibold">
              Milestone
            </span>
          )}
        </p>
      </div>
    );
  }
export default LogCard;  