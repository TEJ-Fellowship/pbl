import './Quiz.css'
function Quiz(){
return (
<div className='container'> 
<div className="question-card">
    <h2 className="timer">30</h2>

    <h2 className="question-title">What is the capital city of Nepal?</h2>
    
    <p className='topic' id='topic'>Social</p>
    <hr className='underline'></hr>
    <div className='options'>
    <h3 className='option1'>option1 </h3>
    <h3 className='option1'>option2 </h3>
    <h3 className='option1'>option3 </h3>
    <h3 className='option1'>option4 </h3>
    </div>
    <h3 className='next'> Next </h3>
</div>
</div>
)
}
export default Quiz;
