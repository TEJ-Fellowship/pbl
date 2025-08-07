import React,{useState} from 'react'
import Card from './Card'
import girl1 from '/src/images/image.png'
import girl2 from '/src/images/image copy.png'
import GoalForm from './GoalForm'

function Goal({addGoal,setActiveSection}) {
  const [isClicked,setIsClicked] = useState(false);

  return (
    <>
    <div className='card-container'> 
{isClicked ? (<GoalForm onSubmit={(goal) =>{
  addGoal(goal); /// goal = task
  console.log("Goal Added:", goal);
  setIsClicked(false);
  setActiveSection("home");
}}/>
)
:(
<>
      <Card
      heading="Fitness"
      source = {girl1}
      onPlusClick ={()=> setIsClicked(true)}

       />

<Card
      heading="Fitness"
      source = {girl2}
      onPlusClick ={()=> setIsClicked(true)}
       />
       </>
      
)}
</div>

  </>
  )}

export default Goal;
