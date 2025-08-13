import { useEffect, useState } from "react";
import { getIngredientAlternatives } from "../../../../gemini";
import styles from "./AlternativesCard.module.css";


const AlternativesCard = ({ recipe }) => {
  const [alternatives, setAlternatives] = useState("");
  const [loadingAlt, setLoadingAlt] = useState(false);

useEffect(() => {
  if (recipe && recipe.ingredients) {
    console.log("📦 Ingredients passed to getIngredientAlternatives:", recipe.ingredients); // 👈 Add this

    const fetchAlternatives = async () => {
      setLoadingAlt(true);
      try {
        const response = await getIngredientAlternatives(
          Array.isArray(recipe.ingredients)
            ? recipe.ingredients
            : [recipe.ingredients]
        );
        setAlternatives(response);
      } catch (err) {
        console.error("⚠️ Failed to fetch alternatives:", err); // 👈 Add this
        setAlternatives("Failed to generate alternatives.");
      } finally {
        setLoadingAlt(false);
      }
    };

    fetchAlternatives();
  }
}, [recipe]);


  return (
    <div className={styles.card}>
      <h3>🧠 AI Ingredient Alternatives</h3>
      {loadingAlt ? (
        <p>Loading suggestions...</p>
      ) : (
        <pre style={{ whiteSpace: "pre-wrap" }}>{alternatives}</pre>
      )}
    </div>
  );
};

export default AlternativesCard;