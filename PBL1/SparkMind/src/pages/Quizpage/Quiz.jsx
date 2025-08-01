import './Quiz.css'
import React from 'react'
import Quiz_timer from './Quiz_timer'
import { useNavigate } from 'react-router-dom'


function Quiz(){
    const navigate = useNavigate();
    const handleResults=()=>{
        navigate("/result");
    }

return (
<div className='container'> 
<div className="question-card">
     <Quiz_timer/>
    <h2 className="question-title">What is the capital city of Nepal?</h2>
    
    <p className='topic' id='topic'>Social</p>
    <hr className='underline'></hr>
    <div className='option-container'>
    <h3 className='option1'>option1 </h3>
    <h3 className='option1'>option2 </h3>
    <h3 className='option1'>option3 </h3>
    <h3 className='option1'>option4 </h3>
    {/* <h3 className='next'> Next </h3> */}
    <h3 className='next' onClick={handleResults}> View Results </h3>
    </div>
</div>
</div>
)
}

export default Quiz;
