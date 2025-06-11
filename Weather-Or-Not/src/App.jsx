import { useEffect, useState } from "react";
import { getAllCountries } from "./services/countries_api";
import { toast } from "sonner";

import SearchBar from './components/SearchBar';

function App() {
  const [countryData, setCountryData] = useState([]);

  useEffect(() => {
    const fetchCountries = async () => {
      toast.success("Fetching countries...");
      try {
        const countriesDAta = await getAllCountries();
        setCountryData(countriesDAta);
      } catch (error) {
        toast.error(`Error in fetching countries data: ${error.message}`);
      }
    };

    fetchCountries();
  }, []);
  return (
    <>
      <h1>Weather & Air Quality</h1>
      <p>Search any city to get real-time weather and air quality information</p>
      <br />
      <SearchBar />
      <p>Your comprehensive weather and air quality companion</p>
      <h2>Countries List</h2>
      <ul>
        {countryData.map((country) => (
          <li key={country.cca2 || country.cca3}>{country.name.common}</li>
        ))}
      </ul>
    </>
  );
}

export default App;
