import React from 'react'

function CreateButton({handleClick}) {
  return (
   <button onClick={handleClick} className='createbtn' >➕ Create</button>
  )
}

export default CreateButton