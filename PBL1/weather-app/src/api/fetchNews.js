import config from "../config/config";

// This function fetches the latest news articles for a given city using the News API.
const fetchNews = async (city) => {
  try {
    // Get the News API key from the config
    const { NEWS_API_KEY } = config;
    if (!NEWS_API_KEY) {
      throw new Error("News API key not found");
    }
    // Construct API URL with query parameters:
    // - q: search query (city name)
    // - sortBy: sort articles by publication date
    // - pageSize: limit number of articles to 5
    // - apiKey: authentication key for NewsAPI
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${city}&sortBy=publishedAt&pageSize=5&apiKey=${NEWS_API_KEY}`
    );
    const data = await response.json();

    // Check if the response status is "ok"
    if (data.status === "ok") {
      return {
        success: true,
        data: data.articles, // Array of news articles
      };
    } else {
      // If the status is not "ok", throw an error with the message from the API
      throw new Error(data.message || "Failed to fetch news");
    }
  } catch (error) {
    // Log the error and return a failure response
    console.error("Error fetching news:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export default fetchNews;
