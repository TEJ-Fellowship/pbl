import React,{useState} from 'react'


import './Categories.css';
import CategoryCard from './CategoryCard';
import Study from '../assets/study.png'
import Exercise from '../assets/exercise.png'
import Diet from '../assets/diet.png'
import Travel from '../assets/travel.png'
import Hygiene from '../assets/hygiene.png'
import Finance from '../assets/finance.png'
import Hobbies from '../assets/hobbies.png'
import Career from '../assets/career.png'
import GoalForm from './GoalForm'

function Categories({addGoal,setActiveSection}) {
    const[isClicked,setIsClicked] = useState(0)
    const categories = [
  { title: "Study", image:Study, showPlus: true },
  { title: "Exercise", image:Exercise , showPlus:true},
  { title: "Diet", image: Diet },
  { title: "Hygiene", image: Hygiene},
  { title: "Finance", image: Finance },
  { title: "Travel", image: Travel },
  { title: "Hobbies", image: Hobbies },
  { title: "Career", image: Career},
  { title: "Others"},
];
    return (
        <>
            <div className="card-container">
                {isClicked ? (
                    <GoalForm
                        onSubmit={(goal) => {
                            addGoal(goal); // goal = task
                            setIsClicked(false);
                            setActiveSection("home");
                        }}
                    />
                ) : (
                    <div id="cat">
            {categories.map((cat, index) => (
                <CategoryCard
                    key={index}
                    title={cat.title}
                    image={cat.image}
                                onPlusClick={() => {
                                    setIsClicked(true);
                                    console.log("clicked");
                                }}
                />
            ))}
                    </div>
                )}
        </div>
        </>
    );
};

export default Categories
