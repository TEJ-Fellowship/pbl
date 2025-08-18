import React from 'react'
import '../css/Geminicard.css'
function GeminiCard({setAiResponse,aiResponse,handleGemini,handleaskGemini,isLoading}) {
  return (
    <div className='geminimain'>

        <div className="geminiheader">
            <h2>Your Summary From Ai</h2>
        <button  className="crossShoww" onClick={()=>{
            handleaskGemini()
            setAiResponse('')
        }}>
          X        </button>
      </div>
      <hr className="tophrrshow" />
      <div className="content"> {isLoading ? "Summarizing... Please wait few seconds" : aiResponse}</div>
      <button onClick={handleGemini} className='wantbtn'>Want Summary?</button>
    </div>
  )
}

export default GeminiCard