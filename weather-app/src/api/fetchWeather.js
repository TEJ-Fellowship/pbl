import config from "../config/config";
const fetchWeather = async (city) => {
  const { baseApiUrl, API_KEY } = config;
  const response = await fetch(
    `${baseApiUrl}/weather?q=${city}&appid=${API_KEY}&units=metric`
  );
  const data = await response.json();
  return data;
};

export default fetchWeather;
