import React, { useState } from "react";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: "AIzaSyBiX2E3HIrVqtbddMEuHVZmULrliNksLzI",
});

const GeminiApi = () => {
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");

  const handleGemini = async () => {
    try {
      setLoading(true);
      const quizPrompt = `Generate a quiz with exactly 5 multiple-choice questions about ${title}.
    Return ONLY a valid JSON object with no explanations or markdown. Format it like this:
    [
  {
    "id": 1,
    "topic": "string",
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "answer": "string"
  }
]`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: quizPrompt,
      });

      console.log(response.text);

      setAiResponse(response);
      setLoading(false);
    } catch (error) {
      console.log("something is not fine");
      console.error("Error:", error);
      setAiResponse(error.message);
      setLoading(false);
    }
  };

  return (
    <>
      <input
        type="text"
        placeholder="enter the topic for Quiz"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button onClick={handleGemini}>
        {loading ? "Thinking..." : "Answer"}
      </button>

      {/* <p>{aiResponse}</p> */}
    </>
  );
};

export default GeminiApi;

// import React, { useState } from "react";
// import { GoogleGenAI } from "@google/genai";

// const ai = new GoogleGenAI({
//   apiKey: "AIzaSyBiX2E3HIrVqtbddMEuHVZmULrliNksLzI",
// });

// const cleanResponse = (text) => {
//   return (
//     text
//       // Remove code blocks
//       .replace(/```[\s\S]*?```/g, "")
//       // Remove inline code
//       .replace(/`([^`]+)`/g, "$1")
//       // Remove bold and italic
//       .replace(/\*\*(.*?)\*\*/g, "$1")
//       .replace(/\*(.*?)\*/g, "$1")
//       // Remove links but keep text
//       .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
//       // Remove headers
//       .replace(/^#{1,6}\s+.*$/gm, "")
//       // Remove list markers
//       .replace(/^[\s]*[-*+]\s+/gm, "")
//       .replace(/^[\s]*\d+\.\s+/gm, "")
//       .trim()
//   );
// };

// const GeminiApi = () => {
//   const [aiResponse, setAiResponse] = useState("");
//   const [title, setTitle] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleGemini = async () => {
//     try {
//       setLoading(true);
//       const quizPrompt = `Generate a quiz with 5 multiple choice questions about ${title}.
//       Return ONLY a valid JSON object with no additional text, markdown, or code blocks.
//       The JSON must strictly follow this format:
//       {
//         "questions": [
//           {
//             "question": "string",
//             "options": ["string", "string", "string", "string"],
//             "correctAnswer": "string"
//           }
//         ]
//       }`;
//       const response = await ai.models.generateContent({
//         model: "gemini-2.5-flash",
//         contents: quizPrompt,
//       });
//       //   console.log(response.text);
//       let result = response.text;
//       let cleanedResponse = result
//         .replace(/```json\n?/g, "") // Remove ```json
//         .replace(/```\n?/g, "") // Remove ```
//         .trim(); // Remove extra whitespace
//       let parsedData = JSON.parse(cleanedResponse);
//       console.log(result);
//       console.log(parsedData);
//       console.log(parsedData.questions[0].question);
//       //   console.log("first question: ", cleanedResponse.questions[0].question);
//       setAiResponse(parsedData.questions.map((obj) => obj.question));
//       setLoading(false);
//     } catch (error) {
//       console.error(error.message);
//       setAiResponse(error.message);
//       setLoading(false);
//     }
//   };

//   return (
//     <div>
//       <input
//         placeholder="Enter a prompt here"
//         value={title}
//         onChange={(e) => setTitle(e.target.value)}
//       />
//       <button onClick={handleGemini}>
//         {loading ? "Thinking..." : "Answer"}
//       </button>
//       <p style={{ whiteSpace: "pre-wrap" }}>{aiResponse}</p>
//     </div>
//   );
// };
