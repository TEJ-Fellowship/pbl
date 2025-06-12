const CountryList = ({ countryData, handleShow }) => {
    return (
            <ul>
                {countryData.map((country) => (
                    <li key={country.cca2 || country.cca3}
                    > {country.name.common}
                        <button onClick={() => handleShow(country)}>Show</button>
                    </li>
                ))}
            </ul>
    )
}

export default CountryList;