import React, { useState } from "react";
import styles from "./Recipeformpage.module.css";

const Recipeformpage = () => {
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [category, setCategory] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [preptime, setPreptime] = useState("");
  const [steps, setSteps] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageURL = URL.createObjectURL(file);
      setImagePreview(imageURL);
    }
  };

  const handleSave = () => {
    const newRecipe = {
      title,
      category,
      ingredients,
      steps,
      preptime,
      image: imagePreview,
      createdAt: new Date().toISOString(),
    };

    const existingRecipes = JSON.parse(localStorage.getItem("recipes")) || [];
    const updatedRecipes = [...existingRecipes, newRecipe];
    localStorage.setItem("recipes", JSON.stringify(updatedRecipes));

    // Reset form
    setTitle("");
    setCategory("");
    setIngredients("");
    setSteps("");
    setPreptime("");
    setImagePreview(null);

    alert("Recipe saved successfully!");
  };

  return (
    <div className={styles.maindiv}>
      <h1 className={styles.title}>Manage Your Recipes</h1>
      <div className={styles.formPreviewWrapper}>
        {/* Left: Form Section */}
        <div className={styles.container}>
          <div className={styles.formGroup}>
            <label htmlFor="title">Recipe Title</label>
            <input
              id="title"
              type="text"
              placeholder="Enter recipe title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Category and Image Upload side by side */}
          <div className={styles.catNimgsec}>
            <div className={styles.formGroup}>
              <label htmlFor="category">Choose a category:</label>
              <select
                id="category"
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="" disabled>
                  Select category
                </option>
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snacks">Snacks</option>
                <option value="Supper">Supper</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="imageUpload">Upload Image</label>
              <input
                id="imageUpload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="ingredients">Ingredients</label>
            <textarea
              id="ingredients"
              className={styles.txtarea}
              placeholder="Enter ingredients"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="steps">Steps</label>
            <textarea
              id="steps"
              className={styles.txtarea}
              placeholder="Enter steps to prepare your recipe"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="preptime">Preparation Time (minutes)</label>
            <input
              id="preptime"
              type="number"
              placeholder="Enter time in minutes"
              value={preptime}
              onChange={(e) => setPreptime(e.target.value)}
            />
          </div>

          <div className={styles.buttonGroup}>
            <button className={styles.cancelBtn} type="button">
              Cancel
            </button>
            <button className={styles.saveBtn} type="button" onClick={handleSave}>
              Save Recipe
            </button>
          </div>
        </div>

        {/* Right: Preview Box */}
        {(imagePreview || title || ingredients || preptime || category) && (
          <div className={styles.previewWrapper}>
            <div className={styles.previewCard}>
              {imagePreview && <img src={imagePreview} alt="Preview" />}
              <div className={styles.previewContent}>
                {category && <h2>{category}</h2>}
                {title && <h3>{title}</h3>}
                {ingredients && <p>{ingredients.slice(0, 100)}...</p>}
                {preptime && <p>Preparation Time: {preptime} minutes</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recipeformpage;
