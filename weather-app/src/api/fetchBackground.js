import config from "../config/config";
const fetchBackground = async (city) => {
  const { baseApiUrl, API_KEY } = config;
  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${city}&per_page=1`,
      {
        headers: {
          Authorization:
            "qb7LlK65pIuKveqZrFwV41zwTd9HJCIT0NpyHTemtkJEYn8fVZiQjSRr",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.photos || data.photos.length === 0) {
      throw new Error("No photos found for this city");
    }

    const photo = data.photos[0];
    console.log("photo", photo);
    return photo;
  } catch (error) {
    console.error("Error fetching background:", error);
    return null;
  }
};

export default fetchBackground;
