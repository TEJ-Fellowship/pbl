const RECENT_SEARCHES_KEY = "weather_recent_searches";
const MAX_RECENT_SEARCHES = 5;

// Retrieves recent searches from localStorage
export const getRecentSearches = () => {
  try {
    const searches = localStorage.getItem(RECENT_SEARCHES_KEY);
    // Convert JSON string to array, return empty array if no searches exist
    return searches ? JSON.parse(searches) : [];
  } catch (error) {
    console.error("Error reading recent searches from localStorage:", error);
    return [];
  }
};

//Adds a new city search to localStorage
export const saveRecentSearch = (city) => {
  try {
    const searches = getRecentSearches();

    // Remove duplicate if exists (case insensitive)
    const filteredSearches = searches.filter(
      (search) => search.toLowerCase() !== city.toLowerCase()
    );

    // Add new city to beginning of array and limit to MAX_RECENT_SEARCHES
    const updatedSearches = [city, ...filteredSearches].slice(
      0,
      MAX_RECENT_SEARCHES
    );
    // Save updated searches back to localStorage
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedSearches));
    return updatedSearches;
  } catch (error) {
    console.error("Error saving recent search to localStorage:", error);
    return [];
  }
};

//Removes all recent searches from localStorage
export const clearRecentSearches = () => {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    return [];
  } catch (error) {
    console.error("Error clearing recent searches from localStorage:", error);
    return [];
  }
};

// Removes a specific city search from localStorage
export const removeRecentSearch = (cityToRemove) => {
  try {
    const searches = getRecentSearches();
    // Filter out the city to remove (case insensitive)
    const updatedSearches = searches.filter(
      (search) => search.toLowerCase() !== cityToRemove.toLowerCase()
    );
    // Save updated searches back to localStorage
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedSearches));
    return updatedSearches;
  } catch (error) {
    console.error("Error removing recent search from localStorage:", error);
    return getRecentSearches();
  }
};
