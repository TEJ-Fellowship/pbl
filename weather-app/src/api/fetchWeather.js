import config from "../config/config";
const fetchWeather = async (city) => {
  const { baseApiUrl, API_KEY } = config;
  try {
    const response = await fetch(
      `${baseApiUrl}/weather?q=${city}&appid=${API_KEY}&units=metric`
    );
    const data = await response.json();
    console.log("Fetchweather data", data);
    return data;
  } catch (error) {
    console.log("error in fetchWeather", error);
    throw error;
  }
};

export default fetchWeather;
