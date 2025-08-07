import React, { useState } from "react";
import { GoogleGenAI } from "@google/genai";
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

function Gemini({setAllGoals,goals}) {
  const [prompt, setPrompt] = useState("");

  function getTaskBreakdownPrompt(userGoal) {
    return `You are a goal planner.Based on the user's objective, generate a structured task breakdown in the following JSON format:
{
          "goals": [
            {
              "id": number,
              "title": "Subgoal or Phase Title",
              "tasks": [
                { "id": number, "text": "Specific task or action step" }
              ]
            }
          ]
        }

        Rules:
        - Each "goal" is a major step, phase, or milestone.
        - Each goal must have 2-4 actionable tasks.
        - Output only the JSON. No extra explanation.

        User's goal:
        "${userGoal}
`}
  


const handleGemini=async ()=> {

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: getTaskBreakdownPrompt(prompt),
    });
    
    let cleanedResponse = response.text.replace(/```json\n?/g, "").replace(/```\n?/g,"").trim();
   const parsed = JSON.parse(cleanedResponse)
   setAllGoals([...goals,...parsed.goals])
    



  } catch (e) {
    console.log(e.messsage);
  }
}

return (
  <>
    <div className="propmt">
      <textarea
        className="styled-textarea"
        type="text"
        placeholder="enter your prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button className="ask" onClick={handleGemini}>
        Ask Gemini
      </button>
    </div>
  </>
);
}

export default Gemini;