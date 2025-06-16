import { useEffect, useState } from "react";
import { getCityCoordinates } from "./services/countries_api";
import { toast } from "sonner";
import "./styles/index.css";
import { MapPin, Search, Loader2 } from "lucide-react";
import SearchBar from "./components/SearchBar";
import CityList from "./components/CityList";
import CityDetail from "./components/CityDetail";
import WeatherInfo from "./components/WeatherInfo";

function App() {
  const [cities, setCities] = useState([]);
  const [searchItem, setSearchItem] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);

  useEffect(() => {
    const fetchCities = async () => {
      if (!searchItem || searchItem.trim() === "") {
        setCities([]);
        return;
      }

      setIsLoading(true);
      try {
        const cityName = searchItem.split(",")[0].trim();
        const citiesData = await getCityCoordinates(cityName);
        setCities(citiesData);
      } catch (error) {
        toast.error(`Error fetching cities: ${error.message}`);
        setCities([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchCities, 500);
    return () => clearTimeout(timeoutId);
  }, [searchItem]);

  const handleSearch = (e) => {
    // Ensure value is never undefined
    const value = e.target.value || "";
    setSearchItem(value);
    setSelectedCity(null);
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    // Ensure city.name is never undefined
    setSearchItem(city.name || "");
    setCities([]);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Searching cities...</span>
        </div>
      );
    }

    if (!searchItem) {
      return (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            Start typing to search for cities
          </p>
        </div>
      );
    }

    if (cities.length === 0 && !selectedCity) {
      return (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No cities found</p>
          <p className="text-gray-400 text-sm mt-2">
            Try searching for a different city name
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {cities.length > 0 && (
          <div>
            <CityList cities={cities} onCitySelect={handleCitySelect} />
          </div>
        )}

        {selectedCity && (
          <div className="space-y-6">
            <CityDetail city={selectedCity} />
            <WeatherInfo selectedCity={selectedCity} />
          </div>
        )}
      </div>
    );
  };
  const handleClear = () => setSearchItem("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <MapPin className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-800">Weather or Not</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your comprehensive weather and air quality companion
          </p>
        </header>

        <section className="mb-8">
          <SearchBar searchItem={searchItem} handleSearch={handleSearch} onClear={handleClear} />
        </section>

        <section className="bg-white rounded-lg shadow-lg p-6">
          {renderContent()}
        </section>
      </div>
    </div>
  );
}

export default App;
