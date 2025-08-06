import {React, useState} from 'react'
import CreateButton from './CreateButton'
import AddEventCard from './AddEventCard'

function Sidediv() {
    const [popup, setpopup] = useState(false)
    function handleClick() {
        setpopup(!popup)
    }
  
    return (
    <div className="sidediv">
    <CreateButton handleClick={handleClick} />
    {popup && <AddEventCard handleClick={handleClick} />}
  </div>
  )
}

export default Sidediv;