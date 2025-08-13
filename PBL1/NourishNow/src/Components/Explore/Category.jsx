import styles from './Category.module.css';

function Category(props) {
  return (
    <div className={styles.eachCategory}>
      <div className={`${styles[props.id]} ${styles.card}`}>
        <div className={styles.overlay}></div>
        <h5 className={styles.categoryLabel}>{props.name}</h5>
      </div>
    </div>
  );
}

export default Category;
