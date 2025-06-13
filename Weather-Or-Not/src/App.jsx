import { useEffect, useState, useRef } from "react";
import { getAllCountries } from "./services/countries_api";
import { toast } from "sonner";

import SearchBar from "./components/SearchBar";
import CountryList from "./components/CountryList";
import CountryDetail from "./components/CountryDetail";

/*
##State Management
1. State to store all countries data - countryData
2. State to store the current search input from the user - searchItem
3. State to store countries that match/filtered by the search input - filteredCountries
4. State to store the currently selected country for detail view - selectedCountry
*/

function App() {
  const [countryData, setCountryData] = useState([]);
  const [searchItem, setSearchItem] = useState("");
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const hasFetched = useRef(false);

  console.log("filteredCountries: ", filteredCountries);
  console.log("searchItem: ", searchItem);
  //Fetch countries when the component mounts
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    const fetchCountries = async () => {
      toast.info("Fetching countries...");
      try {
        const countriesData = await getAllCountries(); //API call to fetch all countries
        setCountryData(countriesData); //Store the fetched data in the state
        toast.success("Countries fetched successfully");
      } catch (error) {
        toast.error(`Error in fetching countries data: ${error.message}`); // Show error toast if fetch fails
      }
    };

    fetchCountries();
  }, []);

  // Filter countries based on the search input
  useEffect(() => {
    if (searchItem.trim() === "") {
      setFilteredCountries([]); //Clear filtered results if search inputis empty
      return;
    }
    //Filter countries that match the search input(case-insensitive)
    const filtered = countryData.filter((country) =>
      country.name.common.toLowerCase().includes(searchItem.toLowerCase())
    );
    setFilteredCountries(filtered);
  }, [searchItem, countryData]);

  const handleSearch = (e) => {
    setSearchItem(e.target.value);
    setSelectedCountry(null); // Reset selected country when user starts searching
  };

  // Handler to show details of a specific country
  const handleShow = (country) => {
    setSelectedCountry(country); // Set selected country to display its details
  };

  return (
    <>
      <h1>Weather or Not</h1>
      <p>Your comprehensive weather and air quality companion</p>
      <h2>Weather</h2>

      <br />
      <SearchBar searchItem={searchItem} handleSearch={handleSearch} />

      {selectedCountry ? (
        <CountryDetail country={selectedCountry} />
      ) : filteredCountries.length <= 10 && filteredCountries.length > 1 ? (
        <CountryList countryData={filteredCountries} handleShow={handleShow} />
      ) : filteredCountries.length === 1 ? (
        <CountryDetail country={filteredCountries[0]} />
      ) : searchItem && filteredCountries.length === 0 ? (
        <p>No countries found.</p>
      ) : null}
    </>
  );
}

export default App;
