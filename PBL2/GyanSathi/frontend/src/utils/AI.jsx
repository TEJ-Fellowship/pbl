import { GoogleGenAI } from "@google/genai";
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey })


const useGeminiAI = () => {
    async function sumarizeLesson(params) {
        const prompt = ""
        try{
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            })
            console.log(response.text)
        } catch (error){
            console.log("Gemini error:", error.message)
        }
    }

}

export default useGeminiAI