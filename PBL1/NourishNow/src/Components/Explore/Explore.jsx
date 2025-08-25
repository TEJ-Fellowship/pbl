
import Category from "./Category";
import styles from "./Explore.module.css"


const Explore = () => {
  return (
    <>
    {/* <h2 className={styles.categoryName}>Browse By Category</h2> */}
    <div className={styles.Explore}>
      <div className={styles.browseByCategory}>
        <Category id="quickeasy" name="Quick & Easy" />
        <Category id="vegetarian" name="Vegetarian" />
        <Category id="desserts" name="Desserts" />
        <Category id="healthy" name="Healthy" />
        <Category id="italian" name="Italian" />
        <Category id="mexican" name="Mexican" />
      </div>
    </div>
    </>
  );
};

export default Explore;
