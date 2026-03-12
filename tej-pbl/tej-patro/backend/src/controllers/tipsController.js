import { GoogleGenerativeAI } from "@google/generative-ai";
require("dotenv").config();

const apiKey = process.env.GEMINI_API_KEY;
async function getTips(req, res, next) {
    const { start, end } = req.query;
    try {
        console.log(start, end)
        // Initialize Gemini AI News
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const prompt = `Provide the tips on the basis of events that are presented in between the date range ${start} to ${end}.

Return the result in the following JSON format:

{
  "tips": [
    {
      "title": "Tip 1",
      "description": "Description of the tip"
    },
    ...
  ]
}
`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result?.response;
    const text = response.text();
    console.log("Gemini AI news Response:", text);

    return {
        data: text,
      };
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    getTips
}