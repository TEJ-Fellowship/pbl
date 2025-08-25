import React from 'react'

function AskGeminiButton({handleaskGemini}) {
  return (
    <button className='geminibtn' onClick={handleaskGemini}>✨Ask Gemini</button>
  )
}

export default AskGeminiButton