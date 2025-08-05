import React from 'react'


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

function Categories() {
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
console.log('image: ',categories[0].image);
    return (
        <>
        <div id ='cat'>
            {categories.map((cat, index) => (
                <CategoryCard
                    key={index}
                    title={cat.title}
                    image={cat.image}
                    showPlus={cat.showPlus}
                />
            ))}
        </div>
        </>
    )
}

export default Categories