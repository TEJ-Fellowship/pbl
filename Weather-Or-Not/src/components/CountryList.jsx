import DisplayEachData from "./DisplayEachData";

const CountryList = ({ countryData }) => {
  return (
    <div>
      {countryData.map((country) => (
        <DisplayEachData
          key={country.cca2 || country.cca3}
          countryData={country}
        />
      ))}
    </div>
  );
};

export default CountryList;
