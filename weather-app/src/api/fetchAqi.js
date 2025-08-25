import config from "../config/config";
const fetchAqi = async (lat, lon) => {
  const { baseApiUrl, API_KEY } = config;
  try {
    const response = await fetch(
      `${baseApiUrl}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.log("error in fetchAqi", error);
    throw error;
  }
};

export default fetchAqi;
