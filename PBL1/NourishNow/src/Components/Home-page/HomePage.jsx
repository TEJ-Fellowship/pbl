import './homePage.css';
import Category from './Category.jsx';

function HomePage() {
    return (
        <div className='div1'>
            <div className = 'fun-fact-container'>
                <h1 id='head-question'>Did you know?</h1>
                <p id='fun-fact'>Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible.</p>
                <div className='search-entity'>
                    <input className="search-bar" placeholder='🔍 search for recepie'></input>
                    <button id="search-button">Search</button>
                </div>
            </div>
            <h2 className= 'category-name'>Browse By Category</h2>
            <div className="browse-by-category">
                <Category id="quickeasy" name = 'Quick & Easy' />
                <Category id="vegetarian" name = 'Vegetarian' />
                <Category id="desserts" name = 'Desserts' />
                <Category id="healthy" name = 'Healthy' />
                <Category id="italian" name = 'Italian' />
                <Category id="mexican" name = 'Mexican' />
            </div>
        </div>
    );
}

export default HomePage;