import { useEffect, useState, useRef } from "react";
import { getAllCountries } from "./services/countries_api";
import { toast } from "sonner";

import SearchBar from "./components/SearchBar";
import CountryList from "./components/CountryList";
import CountryDetail from "./components/CountryDetail";

function App() {
  /** 
  Note: useState to store the countries data, the search input, and the countries that match/filtered by the search input
*/
  const [countryData, setCountryData] = useState([]);
  const [searchItem, setSearchItem] = useState("");

  /** Note: useRef to prevent re-fetching the countries data when the component mounts*/
  const hasFetched = useRef(false);

  /** Note: useEffect to fetch the countries data when the component mounts*/
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    const fetchCountries = async () => {
      toast.info("Fetching countries...");
      try {
        /** Note: API call to fetch all countries*/
        const countriesData = await getAllCountries();
        /** Note: Store the fetched data in the state*/
        setCountryData(countriesData);
        toast.success("Countries fetched successfully");
      } catch (error) {
        /** Note: Show error toast if fetch fails*/
        toast.error(`Error in fetching countries data: ${error.message}`);
      }
    };

    fetchCountries();
  }, []);

  const handleSearch = (e) => {
    setSearchItem(e.target.value);
  };

  let searchCountry = countryData.filter((nameList) => {
    return nameList.name.common
      .toLowerCase()
      .includes(searchItem.toLowerCase());
  });
  return (
    <>
      <h1>Weather or Not</h1>
      <p>Your comprehensive weather and air quality companion</p>
      <br />
      <SearchBar searchItem={searchItem} handleSearch={handleSearch} />
      <br />
      {searchCountry.length > 10 ? (
        <p>Too many matches, specify another filter</p>
      ) : searchCountry.length === 1 ? (
        <CountryDetail country={searchCountry[0]} />
      ) : searchCountry.length === 0 ? (
        <p>No countries found.</p>
      ) : (
        <CountryList countryData={searchCountry} />
      )}
    </>
  );
}

export default App;
