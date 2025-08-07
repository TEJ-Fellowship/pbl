import React from 'react'
import { FaPlus } from 'react-icons/fa'
import './CategoryCard.css'
 
function CategoryCard({title, image, onPlusClick}) {
    return(
        <div className ="category-card">
            
                <div className='card-title'>
                    {title} {<FaPlus className="plus-icon" onClick={onPlusClick}/>}
                </div>
            {image && <img src={image} alt ={title || 'Category'} className='card-image' />}

        </div>
    );
}
export default CategoryCard