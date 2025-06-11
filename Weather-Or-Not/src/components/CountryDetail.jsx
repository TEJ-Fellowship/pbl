const CountryDetail = ({ country }) => {
    if (!country) {
        return null;
    }

    const flagUrl = country.flags?.png || country.flags?.svg;
    const countryName = country.name?.common || 'Unknown Country';
    const capital = country.capital?.[0] || 'Unknown Capital';

    return (
        <div>
            <h2>Country Details</h2>
            <div>
                {flagUrl && (
                    <img
                        src={flagUrl}
                        alt={`Flag of ${countryName}`}
                        style={{
                            width: '60px',
                            height: '40px',
                            objectFit: 'cover',
                            border: '1px solid #ddd'
                        }}
                    />
                )}
                <div>
                    <p><strong>Country:</strong> {countryName}</p>
                    <p><strong>Capital:</strong> {capital}</p>
                </div>
            </div>
        </div>
    );
};

export default CountryDetail;