import { useEffect,useState } from "react";
import countriesApi from './services/coutries_api'

function App() {
const [countryData,setCountryData] = useState([])

  useEffect(()=>{
   countriesApi.getAllCountries().then(
   data=>{
   console.log(data,"ctry data")
   setCountryData(data)
   })
   .catch(error=>{
    console.error('Error fetching countries: ',error)
   })
  },[])
  return (
    <>
      <h1>Weather or Not</h1>
      <p>Your comprehensive weather and air quality companion</p>
     <h2>Countries List</h2>
      <ul>
        {countryData.map(country=>(
          <li key={country.cca2 ||country.cca3}>{country.name.common}</li>
        ))}
      </ul>
    </>
  );
}

export default App;
