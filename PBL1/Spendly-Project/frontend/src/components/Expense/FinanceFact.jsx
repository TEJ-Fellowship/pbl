import React, { useEffect, useState } from "react";
import { generateFinanceFact } from "../../utils/generateFinanceFacts"; 

const FinanceFact = ({ category }) => {
  const [fact, setFact] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchFact = async () => {
    setLoading(true);
    setError(""); // Clear any previous errors
    
    // Fallback category if none is provided
    const factCategory = category || "general finance";

    try {
      const factText = await generateFinanceFact(factCategory);
      setFact(factText);
    } catch (err) {
      // Catching the error object allows for more specific logging if needed
      console.error("Error in FinanceFact component:", err);
      setError("Failed to fetch fact. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // This condition ensures the API call only happens when a category is provided,
    // or you can set a default if the `category` prop is optional.
    // The `fetchFact` function itself handles the fallback logic.
    fetchFact();
  }, [category]); // The effect re-runs whenever the category prop changes

  return (
    <div className="finance-fact-container">
      {loading && <p>Loading a finance fact...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && !error && <p>{fact}</p>}
      <button onClick={fetchFact} style={{ marginTop: "10px" }}>
        🔄 New Fact
      </button>
    </div>
  );
};

export default FinanceFact;