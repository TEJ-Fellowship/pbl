import { useState } from "react";
import CountryDetail from "./CountryDetail";

const DisplayEachData = ({ countryData }) => {
  const [showCountry, setShowCountry] = useState(false);
  const toggleShowCountry = () => {
    setShowCountry(!showCountry);
  };

  return (
    <div key={countryData.cca2 || countryData.cca3}>
      <li>
        {" "}
        {countryData.name.common}{" "}
        {showCountry ? (
          <>
            <CountryDetail country={countryData} />

            <button onClick={() => toggleShowCountry()}>Hide</button>
          </>
        ) : (
          <>
            <button onClick={() => toggleShowCountry()}>Show</button>
          </>
        )}
      </li>
    </div>
  );
};

export default DisplayEachData;
