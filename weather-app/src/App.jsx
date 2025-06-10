import { useState, useEffect } from "react";
import "./styles/App.css";
import SearchBar from "./components/SearchBar";
import WeatherNavigation from "./components/WeatherNavigation";
import WeatherHeader from "./components/WeatherHeader";
import WeatherCard from "./components/WeatherCard";
import BackgroundImage from "./components/BackgroundImage";
import WeatherDisplay from "./components/WeatherDisplay";

function App() {
  return (
    <>
      <WeatherCard>
        <div className="relative h-[450px]">
          <BackgroundImage />
          <WeatherHeader />
          <SearchBar />
          <button className="absolute bottom-16 right-8 bg-green-400 text-white px-4 py-2 rounded-full shadow hover:bg-green-500 transition">
            LATEST LOCATIONS
          </button>
          <WeatherNavigation />
        </div>
        {/* Bottom Section */}
        <div className="bg-white/80 px-8 py-6 flex flex-col md:flex-row items-center gap-8">
          <WeatherDisplay />
        </div>
      </WeatherCard>
    </>
  );
}

export default App;
