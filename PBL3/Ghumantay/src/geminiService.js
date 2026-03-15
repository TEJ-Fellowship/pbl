import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize Gemini AI only if API key exists
let genAI = null;
if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

export async function generateItinerary(destination, startDate, endDate, totalDays, places, retries = 3) {
  console.log("🚀 generateItinerary() called with:", { 
    destination, 
    startDate, 
    endDate, 
    totalDays, 
    places: places?.length ? places : "No places provided",
    retries 
  });

  // Validate API key
  if (!API_KEY) {
    console.error("❌ API key is missing!");
    throw new Error("Gemini API key is missing! Please check your .env file and ensure VITE_GEMINI_API_KEY is set.");
  }

  // Validate required parameters
  if (!destination || !startDate || !endDate || !totalDays) {
    console.error("❌ Missing required parameters:", { destination, startDate, endDate, totalDays });
    throw new Error("Missing required trip parameters. Please ensure destination, dates, and duration are provided.");
  }

  if (!places || places.length === 0) {
    console.error("❌ No places provided");
    throw new Error("No places/checkpoints provided. Please add some destinations to your trip.");
  }

  // Format dates for better readability
  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  const prompt = `
You are a professional travel itinerary planner. Generate a detailed day-by-day itinerary in JSON format.

Trip Details:
- Destination: ${destination}
- Start Date: ${formatDate(startDate)} (${startDate})
- End Date: ${formatDate(endDate)} (${endDate})
- Duration: ${totalDays} days
- Places to visit (in order): ${places.join(", ")}

Requirements:
1. Create EXACTLY ${totalDays} days of activities
2. Include all the provided places/locations in a logical order
3. Add realistic travel times between locations
4. Include specific activities, restaurants, and attractions for each day
5. Consider opening hours and travel logistics

Return ONLY a valid JSON object with this exact format:
{
  "Day 1 (${startDate})": "Morning: Arrive at [destination]. Visit [attraction]. Lunch at [restaurant]. Afternoon: [activity]. Evening: [activity]",
  "Day 2 (date)": "Morning: [activity]. Travel to [next location]. Afternoon: [activity]. Evening: [activity]",
  ...and so on for all ${totalDays} days
}

Important: 
- Return ONLY the JSON object, no explanations or markdown formatting
- Each day should be a detailed string with morning, afternoon, and evening activities
- Include travel times and realistic scheduling
- Make it practical and actionable
`;

  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    console.log(`🔄 Attempt ${attempt}/${retries} to generate itinerary`);
    
    try {
      if (!genAI) {
        throw new Error("Gemini AI not initialized. Check your API key.");
      }

      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });

      console.log("📤 Sending request to Gemini...");
      const result = await model.generateContent(prompt);
      
      if (!result || !result.response) {
        throw new Error("Empty response from Gemini API");
      }

      let text = (await result.response.text()).trim();
      console.log("📥 Raw Gemini response:", text);

      if (!text) {
        throw new Error("Empty text response from Gemini");
      }

      // Clean up the response - remove markdown formatting
      text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      
      // Find JSON object in the response
      let jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // If no braces found, try to extract from the entire response
        console.log("⚠️ No JSON braces found, attempting to parse entire response");
        jsonMatch = [text];
      }

      let jsonString = jsonMatch[0].trim();
      
      // Additional cleaning for common formatting issues
      jsonString = jsonString
        .replace(/^\s*```json\s*/gm, '')
        .replace(/\s*```\s*$/gm, '')
        .replace(/[\u201C\u201D]/g, '"') // Replace smart quotes
        .replace(/[\u2018\u2019]/g, "'") // Replace smart apostrophes
        .trim();

      console.log("🧹 Cleaned JSON string:", jsonString);

      // Attempt to parse JSON
      let parsed;
      try {
        parsed = JSON.parse(jsonString);
      } catch (parseError) {
        console.error("❌ JSON parse failed:", parseError.message);
        throw new Error(`Invalid JSON format: ${parseError.message}`);
      }

      // Validate the parsed result
      if (!parsed || typeof parsed !== 'object') {
        throw new Error("Parsed result is not a valid object");
      }

      const dayKeys = Object.keys(parsed);
      if (dayKeys.length === 0) {
        throw new Error("Generated itinerary is empty");
      }

      // Validate that we have reasonable content
      const hasValidContent = dayKeys.some(key => 
        parsed[key] && typeof parsed[key] === 'string' && parsed[key].length > 10
      );

      if (!hasValidContent) {
        throw new Error("Generated itinerary lacks sufficient detail");
      }

      console.log("✅ Successfully parsed itinerary JSON:", parsed);
      console.log(`📊 Generated ${dayKeys.length} days of activities`);
      
      return parsed;

    } catch (err) {
      console.error(`❌ Attempt ${attempt} failed:`, {
        error: err.message,
        stack: err.stack
      });
      lastError = err;

      // If it's an API key issue, don't retry
      if (err.message.includes('API key') || err.message.includes('unauthorized')) {
        throw err;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  // If we get here, all retries failed
  const errorMessage = lastError?.message || "Unknown error occurred";
  console.error(`❌ All ${retries} attempts failed. Last error:`, errorMessage);
  
  throw new Error(`Failed to generate itinerary after ${retries} attempts. ${errorMessage.includes('API key') ? 'Please check your Gemini API key.' : 'Please try again later.'}`);
}