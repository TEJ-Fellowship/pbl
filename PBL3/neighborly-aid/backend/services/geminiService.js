// tech-master-LA/backend/services/geminiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GEMINI_API_KEY } = require("../config/keys");

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash", // TODO: change to the model you want to use
    });
  }

  async generateTaskSuggestions(title, description) {
    try {
      const prompt = `Based on the following task title and description, suggest appropriate category, urgency level, and karma points.

      Title: "${title}"
      Description: "${description}"

      Available categories: Home-maintenance, Cleaning, Shopping, Transportation, Moving, Gardening, Technology, Pet-care, Cooking, Elderly-care, Childcare, Tutoring, Repairs, Delivery, Event-help, Sports, Community-service, Other

      Available urgency levels: low, medium, high

      Karma Points Guidelines (10-5000 points):
      - Simple, quick tasks (10-50 points): Basic errands, simple favors, short-duration help
      - Regular tasks (51-200 points): Standard household help, moderate time commitment
      - Complex tasks (201-800 points): Skilled work, longer time commitment, specialized knowledge
      - Major tasks (801-2000 points): Significant projects, professional-level work, high impact
      - Emergency/Critical tasks (2001-5000 points): Urgent emergencies, life-critical situations, extensive commitment

      Consider these factors for karma points:
      - Time required (more time = higher points)
      - Skill level needed (specialized skills = higher points)
      - Urgency (urgent tasks = higher points)
      - Physical effort required (heavy work = higher points)
      - Risk or responsibility involved (higher risk = higher points)
      - Impact on requester's life (critical needs = higher points)

      Return ONLY a valid JSON object with no additional text, markdown, or code blocks.
      The JSON must strictly follow this format:
      {
        "suggestedCategories": ["🏠 category1", "🛠️ category2", "🌟 category3"],
        "suggestedUrgency": "urgency_level",
        "suggestedKarmaPoints": karma_number,
        "explanation": "Brief explanation of why these suggestions were made including karma reasoning"
      }

      Rules:
      - Suggest 3 most relevant categories in order of relevance
      - Choose urgency based on context clues like "urgent", "ASAP", "emergency", "soon", "no rush", etc.
      - If no time indicators, default to "medium"
      - Put one relevant emoji for each category at the beginning of the category name
      - Karma points must be between 10 and 5000
      - Explain karma reasoning in the explanation
      - Keep explanation under 80 words`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response.text();

      // Clean up the response
      let cleanedResponse = response
        .replace(/```json\n?/g, "") // Remove ```json
        .replace(/```\n?/g, "") // Remove ```
        .trim(); // Remove extra whitespace

      try {
        const suggestions = JSON.parse(cleanedResponse);

        // Validate structure
        if (
          !suggestions.suggestedCategories ||
          !Array.isArray(suggestions.suggestedCategories) ||
          !suggestions.suggestedUrgency ||
          !suggestions.explanation ||
          !suggestions.suggestedKarmaPoints
        ) {
          throw new Error("Invalid suggestion format");
        }

        // Validate karma points range
        const karmaPoints = parseInt(suggestions.suggestedKarmaPoints);
        if (isNaN(karmaPoints) || karmaPoints < 10 || karmaPoints > 5000) {
          suggestions.suggestedKarmaPoints = this.calculateFallbackKarma(
            suggestions.suggestedUrgency
          );
        } else {
          suggestions.suggestedKarmaPoints = karmaPoints;
        }

        return {
          success: true,
          data: suggestions,
        };
      } catch (parseError) {
        console.error("Task Suggestions Parsing Error:", parseError);

        // Fallback suggestions
        return {
          success: true,
          data: {
            suggestedCategories: [
              "🏠 Other",
              "🛠️ Home-maintenance",
              "🌟 Community-service",
            ],
            suggestedUrgency: "medium",
            suggestedKarmaPoints: 100,
            explanation:
              "Default suggestions due to parsing error. Medium urgency task with standard karma points.",
          },
        };
      }
    } catch (error) {
      console.error("Gemini Task Suggestions Error:", error);
      return {
        success: false,
        error: error.message || "Failed to generate task suggestions",
      };
    }
  }

  // Fallback karma calculation based on urgency
  calculateFallbackKarma(urgency) {
    switch (urgency?.toLowerCase()) {
      case "low":
        return 50;
      case "medium":
        return 150;
      case "high":
        return 500;
      default:
        return 100;
    }
  }
}

module.exports = new GeminiService();
