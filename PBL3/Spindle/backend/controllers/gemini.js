import express from "express"
import { GoogleGenAI } from "@google/genai"
import dotenv from "dotenv"
dotenv.config()

const apiKey = process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({
    apiKey,
})


export const postGemini = async(req,res)=>{
    try {

        const {question} = req.body //poll topic


//FEW-shot  prompting
        const prompt = `You are helping a group quickly decide, or make decisions by suggesting options for a poll.The poll topic is given above.

        Rules:
        - Generate 3-6 short, practical options.
        - Keep each option under 5 words.
        - No duplicates
        - Output must be valid JSON: ["Option A", "Option B", ....]

        Example 1:
        Topic: Where should we eat?
        Output : ["Pizza Place", "Vegan Cafe"]

        Example 2:
        Topic: What movie should we watch?
        Output: ["Action thriller", "Comedy","Sci-Fi"]

        Now generate options for this poll:
        Topic : ${question}
        Output:

        `

        const result = await ai.models.generateContent({
            model:"gemini-2.0-flash",
            contents:prompt
        })

        const response = result.text

        let cleanedResponse = response.replace(/```json\n?/g,"")
        .replace(/```\n?/g,"")
        .trim()

        const parsed = JSON.parse(cleanedResponse)
        res.json({text:parsed})



        
    } catch (error) {
        console.error("Gemini API error:", err.message || err);
        res.status(500).json({ error: "Gemini request failed" });    }
}