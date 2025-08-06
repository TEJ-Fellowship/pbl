import { useState, useEffect } from "react";
import styles from "./HomePage.module.css";
import { FaSearch } from "react-icons/fa";

// Dummy data
const dummyRecipes = [
  {
    title: "Honey Glazed Chicken",
    photo: "/images/test.jpg", // Make sure this is inside your /public/images/ folder
    steps:
      "Marinate chicken, Heat pan, Cook chicken until brown, Add honey glaze, Serve hot.",
    ingredients: ["Chicken", "Honey", "Garlic"],
    prepTime: "30 minutes",
  },
  {
    title: "Vegetarian Pasta",
    photo: "/images/vegetarian-pasta.jpg",
    steps:
      "Boil pasta, Prepare tomato sauce, Mix sauce with pasta, Add basil, Serve.",
    ingredients: ["Pasta", "Tomatoes", "Basil"],
    prepTime: "20 minutes",
  },
];

function HomePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [fact, setFact] = useState("");
  const [loading, setLoading] = useState(true);

  // 🔎 Search Handler
  const handleSearch = () => {
    const result = dummyRecipes.find((recipe) =>
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchResult(result || null);
    setSearched(true);
  };

  // 🍽️ Food Trivia API
  const getFoodFact = async () => {
    const apikey = import.meta.env.VITE_SPOONACULAR_API_KEY;

    try {
      const response = await fetch(
        `https://api.spoonacular.com/food/trivia/random?apiKey=${apikey}`
      );
      const data = await response.json();
      setFact(data.text);
    } catch (err) {
      console.error("Failed to fetch food fact:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getFoodFact();
  }, []);

  const handleFact = () => {
    setLoading(true);
    getFoodFact();
  };

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearched(false);
      setSearchResult(null);
    }
  }, [searchTerm]);

  return (
    <div className={styles.div1}>
      <div className={styles.funFactContainer}>
        <h1 className={styles.headQuestion}>Did you know?</h1>
        <div className={styles.factContainer}>
          {loading ? (
            <div className={`${styles.factText} ${styles.factLoading}`}>
              Loading amazing food fact...
            </div>
          ) : (
            <p className={styles.factText}>{fact}</p>
          )}
        </div>
        <button className={styles.factButton} onClick={handleFact}>
          New Fact
        </button>

        <div className={styles.searchEntity}>
          <input
            className={styles.searchBar}
            placeholder="Search for recipe"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className={styles.searchButton} onClick={handleSearch}>
            <FaSearch />
          </button>
        </div>
      </div>

      {searched && (
        <div className={styles.resultContainer}>
          {searchResult ? (
            <div className={styles.previewCard}>
              <img
                src={searchResult.photo}
                alt={searchResult.title}
                className={styles.recipeImage}
              />
              <div className={styles.recipeDetails}>
                <h2>{searchResult.title}</h2>
                <p>
                  <strong>Ingredients:</strong>{" "}
                  {searchResult.ingredients.join(", ")}
                </p>
                <p>
                  <strong>Steps:</strong> {searchResult.steps}
                </p>
                <p>
                  <strong>Prep Time:</strong> {searchResult.prepTime}
                </p>
              </div>
            </div>
          ) : (
            searchTerm.trim() !== "" && (
              <p className={styles.noResult}>No results found.</p>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default HomePage;
