// import config from "../config/config";
// const fetchWeather2 = async (city) => {
//   const { baseApiUrl, API_KEY } = config;
//   console.log("hellllllllllsaf", baseApiUrl, API_KEY);
//   const response = await fetch(
//     `${baseApiUrl}/weather?q=${city}&appid=${API_KEY}&units=metric`
//   );
//   const data = await response.json();
//   console.log(data);
//   return data;
// };

const fetchWeather = async (city) => {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=26a1c04e3f1b5d57d000395965ceb5f3&units=metric`
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
