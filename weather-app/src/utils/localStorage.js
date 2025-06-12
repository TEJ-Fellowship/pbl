const RECENT_SEARCHES_KEY = "weather_recent_searches";
const MAX_RECENT_SEARCHES = 5;

export const getRecentSearches = () => {
  try {
    const searches = localStorage.getItem(RECENT_SEARCHES_KEY);
    return searches ? JSON.parse(searches) : [];
  } catch (error) {
    console.error("Error reading recent searches from localStorage:", error);
    return [];
  }
};

export const saveRecentSearch = (city) => {
  try {
    const searches = getRecentSearches();

    // Remove duplicate if exists (case insensitive)
    const filteredSearches = searches.filter(
      (search) => search.toLowerCase() !== city.toLowerCase()
    );

    // Add new search at the beginning
    const updatedSearches = [city, ...filteredSearches].slice(
      0,
      MAX_RECENT_SEARCHES
    );

    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedSearches));
    return updatedSearches;
  } catch (error) {
    console.error("Error saving recent search to localStorage:", error);
    return [];
  }
};

export const clearRecentSearches = () => {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    return [];
  } catch (error) {
    console.error("Error clearing recent searches from localStorage:", error);
    return [];
  }
};

export const removeRecentSearch = (cityToRemove) => {
  try {
    const searches = getRecentSearches();
    const updatedSearches = searches.filter(
      (search) => search.toLowerCase() !== cityToRemove.toLowerCase()
    );

    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedSearches));
    return updatedSearches;
  } catch (error) {
    console.error("Error removing recent search from localStorage:", error);
    return getRecentSearches();
  }
};
