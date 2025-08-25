import { GoogleGenAI } from "@google/genai";
import React, { useState } from "react";
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

const useGeminiAI = () => {
  const [loading, setLoading] = useState(false);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [aiResponse, setAIResponse] = useState("");

  async function analyzeSpending(expense) {
    setLoading(true);
    setAIResponse("");

    const prompt = `You are a world-class financial advisor.  

                    Analyze the following expense data and identify spending patterns.  

                    Based on your analysis, give one or two concise financial tips tailored to help the user save money or improve their spending habits.  

                    Only output the advice (no explanation, summary, or data reflection).
                    
                     
                    ## Data: ${JSON.stringify(expense, null, 2)} 
                    
                    Generate advice according to expense provided in 2 sentence with friendly tone in professional way `;

    try {
      //   const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
      //   const result = await model.generateContent(prompt);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      console.log(response.text);
      setAIResponse(response.text);
    } catch (error) {
      console.log("Gemini error:", error.message);
      setAIResponse("Sorry, couldn't analyze your expenses right now.");
    }

    setLoading(false);
  }

  async function parseExpenseFromQuery(userQuery) {
    setExpenseLoading(true);
    const prompt = `
            ## Task: Classify the input into object format

            ## Example: 
                Input: "I end up spending 1,000 for food"
                Output: {
                    amount: 1000,
                    description: "paid for food",
                    category: "Food",
                    date: "2025-08-07",
                },

                Input: "I partied rock hard last night and spent about 10k in Beverage/Alcohol"
                Output: {
                    amount: 10000,
                    description: "Spent on Beverage/Alchol while partying",
                    category: "Beverage",
                    date: "2025-08-07",
                },
            
            ## Instruction: 
            - Analayze the pattern in the example above
            - Apply the same classification logic to the input
            - Respond only with json and add current date 

            ## User Input: ${userQuery}
        `;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      let text = response.text;
      const jsonMatch = text.match(/\{[\s\S]*?\}/);
            console.log(JSON.parse(jsonMatch[0]));

      if(!jsonMatch) return null;

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.log(error.message);
      return null;
    }
  }

  return { aiResponse, analyzeSpending, loading, expenseLoading, parseExpenseFromQuery };
};

export default useGeminiAI;
