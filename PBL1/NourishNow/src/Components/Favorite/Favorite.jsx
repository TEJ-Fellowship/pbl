import { useState, useEffect } from "react";
import styles from "./Favorite.module.css";
import PreviewCard from "../Preview-card/PreviewCard";

const recipesAll = [
  {
    id: 1,
    title: "Spaghetti Bolognese",
    ingredients: [
      "200g spaghetti",
      "100g minced beef",
      "1 onion",
      "2 garlic cloves",
      "400g canned tomatoes",
      "Salt",
      "Pepper",
      "Olive oil",
    ],
    instructions:
      "Cook spaghetti. Sauté onion and garlic, add beef. Add tomatoes, simmer 20 mins. Mix with spaghetti.",
    prepTime: 10,
    cookTime: 25,
    servings: 2,
    category: "Pasta",
    imageUrl: "https://example.com/spaghetti.jpg",
  },
  {
    id: 2,
    title: "Chicken Caesar Salad",
    ingredients: [
      "2 chicken breasts",
      "Romaine lettuce",
      "Croutons",
      "Parmesan cheese",
      "Caesar dressing",
    ],
    instructions:
      "Grill chicken. Toss lettuce, croutons, and cheese with dressing. Top with sliced chicken.",
    prepTime: 15,
    cookTime: 10,
    servings: 2,
    category: "Salad",
    imageUrl: "https://example.com/caesar.jpg",
  },
];

function Favorite() {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({
    title: "",
    prepTime: "",
  });

  // Load localStorage + dummy data
  useEffect(() => {
    const savedRecipes = JSON.parse(localStorage.getItem("recipes")) || [];

    const formattedSaved = savedRecipes.map((r, index) => ({
      id: `local-${index}`,
      title: r.title || "Untitled",
      prepTime: r.preptime || 0,
      category: r.category || "Uncategorized",
      imageUrl: r.image || "",
      instructions: r.steps || "",
      ingredients: r.ingredients
        ? Array.isArray(r.ingredients)
          ? r.ingredients
          : r.ingredients.split(",")
        : [],
    }));

    setRecipes([...formattedSaved, ...recipesAll]);
  }, []);

  function handleEdit(recipe) {
    setEditingId(recipe.id);
    setEditValues({
      title: recipe.title,
      prepTime: recipe.prepTime,
    });
  }

  function handleCancel() {
    setEditingId(null);
    setEditValues({ title: "", prepTime: "" });
  }

  function handleSave(id) {
    const updated = recipes.map((recipe) =>
      recipe.id === id
        ? {
            ...recipe,
            title: editValues.title,
            prepTime: parseInt(editValues.prepTime),
          }
        : recipe
    );
    setRecipes(updated);
    handleCancel();
  }

  function handleDelete(id) {
    const filtered = recipes.filter((recipe) => recipe.id !== id);
    setRecipes(filtered);
    if (selectedRecipe && selectedRecipe.id === id) {
      setSelectedRecipe(null); // close preview if deleted
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setEditValues((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <div className={styles.maincontainer}>
      <ul className={styles.recipeList}>
        {recipes.map((recipe) => (
          <li key={recipe.id} className={styles.recipeItem}>
            {editingId === recipe.id ? (
              <div className={styles.eachRecipe}>
                <input
                  type="text"
                  name="title"
                  value={editValues.title}
                  onChange={handleChange}
                  placeholder="Recipe Title"
                />
                <input
                  type="number"
                  name="prepTime"
                  value={editValues.prepTime}
                  onChange={handleChange}
                  placeholder="Prep Time"
                />
                <span>{recipe.category}</span>
              </div>
            ) : (
              <div className={styles.eachRecipe}>
                <h3
                  onClick={() => setSelectedRecipe(recipe)}
                  style={{
                    cursor: "pointer",
                    color: "#588157",
                    textDecoration: "underline",
                  }}
                >
                  {recipe.title}
                </h3>
                <span>
                  {recipe.category} | preparation-time: {recipe.prepTime} mins
                </span>
              </div>
            )}

            <div className={styles.buttons}>
              {editingId === recipe.id ? (
                <>
                  <button onClick={() => handleSave(recipe.id)}>Save</button>
                  <button onClick={handleCancel}>Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={() => handleEdit(recipe)}>Edit</button>
                  <button onClick={() => handleDelete(recipe.id)}>Delete</button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      {selectedRecipe && (
        <PreviewCard
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  );
}

export default Favorite;
