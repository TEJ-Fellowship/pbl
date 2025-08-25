import React from "react";
import { useEffect, useState } from "react";

function Banner() {
  const apiUrl = "https://api.api-ninjas.com/v1/quotes";
  const apiKey = "FNKr7mOP+SoCJlgbejAbQw==bClQ3ShOT08B6gAv";
  const [quote, setQuote] = useState(null);

  const fetchQuote = () => {
    fetch(apiUrl, {
      method: "GET",
      headers: {
        "X-Api-Key": apiKey,
      },
    })
      .then((res) => res.json())
      .then((data) => setQuote(data[0]));
    // .then((json) => console.log(json));
  };

  useEffect(() => {
    fetchQuote();
  }, []);
  return (
    <>
      <section className="banner">
        <h3 className="banner-title">Quotes</h3>
        <div className="cards">
          {quote && (
            <div className="card quote-card">
              <p className="card-text">“{quote.quote}”</p>
              <p className="card-author">— {quote.author}</p>
              <button className="btn" onClick={fetchQuote}>
                Next Quote
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default Banner;
