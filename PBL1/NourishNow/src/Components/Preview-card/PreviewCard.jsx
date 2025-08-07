import React, { useState } from "react";
import styles from "./PreviewCard.module.css";
import AlternativesCard from "./AiCards/Alternatives/Alternatives";



const PreviewCard = ({ recipe, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableRecipe, setEditableRecipe] = useState({ ...recipe });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableRecipe((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleIngredientsChange = (e) => {
    setEditableRecipe((prev) => ({
      ...prev,
      ingredients: e.target.value.split(",").map((i) => i.trim()),
    }));
  };

  const handleSave = () => {
    const savedRecipes = JSON.parse(localStorage.getItem("recipes")) || [];
    const updatedRecipes = savedRecipes.map((r) =>
      r.id === editableRecipe.id ? editableRecipe : r
    );
    localStorage.setItem("recipes", JSON.stringify(updatedRecipes));
    setIsEditing(false);
  };

  const toggleEdit = () => {
    if (isEditing) {
      handleSave();
    } else {
      setIsEditing(true);
    }
  };

  if (!recipe) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.wrapper}>
        {/* Main Card */}
        <div className={styles.modal}>
          <button className={styles.closeBtn} onClick={onClose}>
            &times;
          </button>

          {/* Image */}
          {isEditing ? (
            <input
              name="imageUrl"
              value={editableRecipe.imageUrl}
              onChange={handleChange}
              placeholder="Image URL"
              className={styles.input}
            />
          ) : (
            editableRecipe.imageUrl && (
              <img
                src={editableRecipe.imageUrl}
                alt={editableRecipe.title}
                className={styles.image}
              />
            )
          )}

          {/* Title */}
          {isEditing ? (
            <input
              name="title"
              value={editableRecipe.title}
              onChange={handleChange}
              className={styles.input}
            />
          ) : (
            <h2>{editableRecipe.title}</h2>
          )}

          {/* Category */}
          {isEditing ? (
            <input
              name="category"
              value={editableRecipe.category}
              onChange={handleChange}
              className={styles.input}
            />
          ) : (
            <h4>Category: {editableRecipe.category}</h4>
          )}

          {/* Preparation Time */}
          {isEditing ? (
            <input
              type="number"
              name="prepTime"
              value={editableRecipe.prepTime}
              onChange={handleChange}
              className={styles.input}
            />
          ) : (
            <p>
              <strong>Preparation Time:</strong> {editableRecipe.prepTime} minutes
            </p>
          )}

          {/* Ingredients */}
          <p>
            <strong>Ingredients:</strong>
          </p>
          {isEditing ? (
            <textarea
              name="ingredients"
              value={editableRecipe.ingredients.join(", ")}
              onChange={handleIngredientsChange}
              className={styles.input}
              rows={3}
            />
          ) : (
            <ul>
              {Array.isArray(editableRecipe.ingredients)
                ? editableRecipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)
                : <li>{editableRecipe.ingredients}</li>}
            </ul>
          )}

          {/* Instructions */}
          <p>
            <strong>Instructions:</strong>
          </p>
          {isEditing ? (
            <textarea
              name="instructions"
              value={editableRecipe.instructions}
              onChange={handleChange}
              className={styles.input}
              rows={4}
            />
          ) : (
            <p>{editableRecipe.instructions}</p>
          )}

          {/* Edit / Save Button */}
          <button className={styles.editBtn} onClick={toggleEdit}>
            {isEditing ? "Save" : "Edit"}
          </button>
        </div>

        {/* Gemini Cards (you can plug in your Gemini data here) */}
        <div className={styles.sideCards}>
          <div className={styles.alternative}>
            <h3>Alternatives</h3>
{/* <AlternativesCard recipe={recipe} /> */}
<AlternativesCard recipe={recipe}/>
          </div>
          <div className={styles.foodCalculator}>
            <h3>Nutrition Chart</h3>
            <p>Chart or Gemini response will go here...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewCard;
