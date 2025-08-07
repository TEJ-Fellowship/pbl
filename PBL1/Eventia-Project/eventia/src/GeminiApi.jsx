import {React,useState} from 'react'
import GeminiCard from './components/GeminiCard';
import { GoogleGenAI } from "@google/genai";
const apiKey=import.meta.env.VITE_GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey});
const now = new Date();
const yyyy = now.getFullYear();
const mm = String(now.getMonth() + 1 - 1).padStart(2, '0'); // Subtract 1
const dd = String(now.getDate()).padStart(2, '0');

const today = `${yyyy}-${mm}-${dd}`;
console.log(today);
function GeminiApi({events,handleaskGemini,isAskGemini}) {
    const [aiResponse,setAiResponse]=useState('')
    const [isLoading, setIsLoading] = useState(false);
    const cleanResponse = (text) => {
  return (
    text
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, "")
      // Remove inline code
      .replace(/`([^`]+)`/g, "$1")
      // Remove bold and italic
      .replace(/\*\*\*?(.*?)\*\*\*?/g, "$1")
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove headers
      .replace(/^#{1,6}\s+.*$/gm, "")
      // Remove list markers
      .replace(/^[\s]*[-*+]\s+/gm, "")
      .replace(/^[\s]*\d+\.\s+/gm, "")
      .trim()
  );
};

const handleGemini=async()=>{
    try{
        setIsLoading(true)
   const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Today is "${today}". From the following events: ${JSON.stringify(events)}, list only those within the next 7 days. Include count by category (e.g., 2 Meetings), event titles, and the first upcoming event. Add a brief insight from the description and a time management tip. Keep it within 50 words.
`,
  });
     console.log(response.text);
    setAiResponse(cleanResponse(response.text))
    setIsLoading(false)
    }catch(error){
        console.log(error)
        setAiResponse(error.message)
    }
   
 
}
  return (
    <div>
        {isAskGemini? <GeminiCard  setAiResponse={setAiResponse} isLoading={isLoading} handleaskGemini={handleaskGemini} aiResponse={aiResponse} handleGemini={handleGemini}/>:'' }
       
    </div>
  )
}

export default GeminiApi