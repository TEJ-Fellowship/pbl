import './Result.css'
import { useNavigate } from 'react-router-dom';
const Result = () => {
    const navigate = useNavigate();

    const handlePlay=()=>{
        navigate("/quiz")
    };
  return (
    <div>
       <div className='resultWrapper'>
        <div className="resultContainer">
            <div className="fraction">
            <span className='score'>4</span><span className='total'>/5</span>
            <br />
            <span style={{color:'grey'}}>correct!</span>
            </div>
            <br />
          <p className='tagline'>You are great</p> 
          <button className='playBtn' onClick={handlePlay}>Play Again</button> 
        </div>
        </div>
    </div>
  )
}

export default Result
