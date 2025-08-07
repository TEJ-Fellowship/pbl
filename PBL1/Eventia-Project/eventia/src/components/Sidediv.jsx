import {React, useState} from 'react'
import CreateButton from './CreateButton'
import AddEventCard from './AddEventCard'
import AskGeminiButton from './AskGeminiButton'
import GeminiCard from './GeminiCard'
function Sidediv({events,setEvents, showHolidays, setShowHolidays}) {
    const [popup,setpopup]=useState(false)
    function handleClick(){

        setpopup(!popup)
    }
    return (
    <div className="sidediv">
    <CreateButton handleClick={handleClick} />
      <div style={{margin: '10px 0'}}>
      <label>
        <input
          type="checkbox"
          checked={showHolidays}
          onChange={e => setShowHolidays(e.target.checked)}
        />
        Show Public Holidays
      </label>
    </div>
    <GeminiCard />
    <AskGeminiButton />
  
    {popup && <AddEventCard handleClick={handleClick} events={events} setEvents={setEvents}/>}
  </div>
  )
}

export default Sidediv;
