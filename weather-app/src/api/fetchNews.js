import config from "../config/config";

const fetchNews = async (city) => {
  try {
    const { NEWS_API_KEY } = config;
    if (!NEWS_API_KEY) {
      throw new Error("News API key not found");
    }

    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${city}&sortBy=publishedAt&pageSize=5&apiKey=${NEWS_API_KEY}`
    );
    const data = await response.json();

    if (data.status === "ok") {
      return {
        success: true,
        data: data.articles,
      };
    } else {
      throw new Error(data.message || "Failed to fetch news");
    }
  } catch (error) {
    console.error("Error fetching news:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export default fetchNews;
