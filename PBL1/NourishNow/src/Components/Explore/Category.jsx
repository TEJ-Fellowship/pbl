import styles from './Category.module.css';

function Category(props) {
    return (
        <div className={styles.eachCategory}>
            <div className={styles[props.id]}></div>
            <h5>{props.name}</h5>
        </div>
    );
}

export default Category;


