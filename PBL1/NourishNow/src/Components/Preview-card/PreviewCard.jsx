import React, { useState, useEffect } from "react";
import styles from "./PreviewCard.module.css";
import AlternativesCard from "./AiCards/Alternatives/Alternatives";
import NutritionChart from "./AiCards/Nutrition/NutritionChart";
import { getNutritionBreakdown } from "../../gemini";

const PreviewCard = ({ recipe, onClose, editingId, onUpdateRecipe }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nutritionData, setNutritionData] = useState({});
  const [editableRecipe, setEditableRecipe] = useState({
    ...recipe,
    id: recipe.id ?? Date.now(),
  });

  useEffect(() => {
    async function fetchNutrition() {
      if (recipe?.ingredients?.length > 0) {
        const data = await getNutritionBreakdown(recipe.ingredients);
        setNutritionData(data);
      }
    }

    fetchNutrition();
  }, [recipe]);

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

    const existingIndex = savedRecipes.findIndex((r) => r.id === editingId);

    let updatedRecipes;
    if (existingIndex !== -1) {
      updatedRecipes = [...savedRecipes];
      updatedRecipes[existingIndex] = editableRecipe;
    } else {
      updatedRecipes = [...savedRecipes, editableRecipe];
    }

    localStorage.setItem("recipes", JSON.stringify(updatedRecipes));

    onUpdateRecipe(editableRecipe);

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
              name="image"
              value={editableRecipe.image}
              onChange={handleChange}
              placeholder="Image URL"
              className={styles.input}
            />
          ) : (
            editableRecipe.image && (
              <img
                src={editableRecipe.image}
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
              <strong>Preparation Time:</strong> {editableRecipe.prepTime}{" "}
              minutes
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
              {Array.isArray(editableRecipe.ingredients) ? (
                editableRecipe.ingredients.map((ing, i) => (
                  <li key={i}>{ing}</li>
                ))
              ) : (
                <li>{editableRecipe.ingredients}</li>
              )}
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

        {/* Gemini Cards */}
        <div className={styles.sideCards}>
          <div>
            <AlternativesCard recipe={recipe} />
          </div>
          <div className={styles.foodCalculator}>
            <h3>Nutrition Chart</h3>
            <NutritionChart nutritionData={nutritionData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewCard;
