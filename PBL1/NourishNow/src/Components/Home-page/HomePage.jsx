import styles from './HomePage.module.css';
import Category from './Category.jsx';

function HomePage() {
    return (
        <div className={styles.div1}>
            <div className={styles.funFactContainer}>
                <h1 className={styles.headQuestion}>Did you know?</h1>
                <p className={styles.funFact}>
                    Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible.
                </p>
                <div className={styles.searchEntity}>
                    <input className={styles.searchBar} placeholder='🔍 search for recepie' />
                    <button className={styles.searchButton}>Search</button>
                </div>
            </div>
            <h2 className={styles.categoryName}>Browse By Category</h2>
            <div className={styles.browseByCategory}>
                <Category id="quickeasy" name='Quick & Easy' />
                <Category id="vegetarian" name='Vegetarian' />
                <Category id="desserts" name='Desserts' />
                <Category id="healthy" name='Healthy' />
                <Category id="italian" name='Italian' />
                <Category id="mexican" name='Mexican' />
            </div>
        </div>
    );
}

export default HomePage;
