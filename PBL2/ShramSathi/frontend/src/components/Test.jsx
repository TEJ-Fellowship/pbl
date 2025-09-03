import React, { useEffect, useState } from "react";
import axios from "axios";

const Test = () => {
  const [newsList, setNewsList] = useState([]);
  const [aiResponse, setAiResponse] = useState({});

  useEffect(() => {
    axios
      .get("http://localhost:3000/news")
      .then((res) => setNewsList(res.data))
      .catch((err) => console.log(err));
  }, []);

  const handleGemini = async () => {
    try {
      const res = await axios.post("http://localhost:3000/api/gemini", {
        news: newsList,
      });
      // console.log("Gemini response:", res.data);
      // console.log("ai response",res.data)

      console.log(res.data);
      setAiResponse(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: "30px", fontWeight: 500 }}>
        Welcome to ShramSathi AI
      </h1>
      <p>Transform problems into actionable community programs</p>

      <button
        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md 
                   hover:bg-blue-700 hover:shadow-lg 
                   active:scale-95 transition-all duration-200 mt-5"
        onClick={() => handleGemini()}
      >
        Get latest news
      </button>

      {aiResponse.text?.relevantNews ? (
        aiResponse.text.relevantNews.map((news, index) => (
          <div key={index} className="w-full mx-auto mt-10">
            <div className="bg-white shadow-lg rounded-2xl p-6">
              <h2>{news.headline}</h2>
              <a
                href={news.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors duration-200"
              >
                Read More →
              </a>
              <p>{news.summary}</p>
              <p>
                <strong>Suggested program:</strong> {news.suggestedProgram}
              </p>
            </div>
          </div>
        ))
      ) : aiResponse.text?.message ? (
        <p className="mt-10 text-gray-600">{aiResponse.text.message}</p>
      ) : null}
    </div>
  );
};

export default Test;
