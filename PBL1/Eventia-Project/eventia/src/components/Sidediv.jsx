import {React, useState} from 'react'
import CreateButton from './CreateButton'
import AddEventCard from './AddEventCard'
import AskGeminiButton from './AskGeminiButton'
import GeminiApi from '../GeminiApi'
function Sidediv({events,setEvents, showHolidays, setShowHolidays}) {
    const[isAskGemini,setaskGemini]=useState(false)
    const [popup,setpopup]=useState(false)
    function handleaskGemini(){
      setaskGemini(!isAskGemini)
    }
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
    <GeminiApi isAskGemini={isAskGemini} handleaskGemini={handleaskGemini} events={events} />
    <AskGeminiButton handleaskGemini={handleaskGemini}/>
     
    {popup && <AddEventCard handleClick={handleClick} events={events} setEvents={setEvents}/>}
  </div>
  )
}

export default Sidediv;
