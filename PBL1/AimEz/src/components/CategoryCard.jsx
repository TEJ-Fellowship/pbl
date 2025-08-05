import React from 'react'
import { FaPlus } from 'react-icons/fa'
import './CategoryCard.css'
 
function CategoryCard({title, image, showPlus}) {
    return(
        <div className ="category-card">
            
                <div className='card-title'>
                    {title} {showPlus && <FaPlus size ={10} style={{ marginLeft: 5}} />}
                </div>
            {image && <img src={image} alt ={title || 'Category'} className='card-image' />}
            {/* {showPlus && <div> + </div>} */}
        </div>
    );
}
export default CategoryCard