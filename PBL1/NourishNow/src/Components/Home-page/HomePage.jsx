import './homePage.css';

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
        </div>
    );
}

export default HomePage;