import './Home.css'
import { useNavigate } from 'react-router-dom';
const Home =()=>{
    const navigate = useNavigate();

    const handlePlay=()=>{
        navigate("/quiz")
    };
    
    return (
        <div className='homeWrapper'>
        <div className="homeContainer">
            <h1 className='logo'>Spark Mind</h1>
          <p className='tagline'>Play 30s Quiz</p> 
          <button className='playBtn' onClick={handlePlay}>Play</button> 
        </div>
        </div>
    )
}

export default Home;