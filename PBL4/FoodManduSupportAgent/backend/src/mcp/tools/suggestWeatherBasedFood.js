/**
 * MCP Tool: Suggest Weather-Based Food Recommendations
 * Provides food suggestions based on current weather conditions and time of day
 */

export const suggestWeatherBasedFood = {
  name: "suggest_weather_based_food",
  description:
    "Suggest food and cuisine types based on current weather conditions, temperature, and time of day",
  inputSchema: {
    type: "object",
    properties: {
      weatherCondition: {
        type: "string",
        description: "Current weather condition (optional, will fetch if not provided)",
      },
      temperature: {
        type: "number",
        description: "Current temperature in Celsius (optional)",
      },
      mealType: {
        type: "string",
        enum: ["breakfast", "lunch", "dinner", "snack", "any"],
        description: "Type of meal (optional, defaults to any)",
        default: "any",
      },
    },
  },
  handler: async ({ weatherCondition, temperature, mealType = "any" }) => {
    try {
      // If weather info not provided, fetch it
      let weatherData = null;
      if (!weatherCondition || !temperature) {
        const lat = 27.7172;
        const lng = 85.324;
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode&timezone=Asia/Kathmandu`
        );
        
        if (weatherResponse.ok) {
          const data = await weatherResponse.json();
          weatherCondition = weatherCondition || data.current.weathercode;
          temperature = temperature || data.current.temperature_2m;
        }
      }

      // Weather condition interpretation
      const weatherTypes = {
        0: "clear",
        1: "clear",
        2: "cloudy",
        3: "cloudy",
        45: "foggy",
        61: "rainy",
        63: "rainy",
        65: "rainy",
        71: "snowy",
        73: "snowy",
        75: "snowy",
        95: "stormy",
        96: "stormy",
      };

      const condition = weatherCondition
        ? weatherTypes[weatherCondition] || "clear"
        : "clear";

      // Time of day
      const currentHour = new Date().getHours();
      const timeOfDay =
        currentHour >= 5 && currentHour < 12
          ? "morning"
          : currentHour >= 12 && currentHour < 17
          ? "afternoon"
          : currentHour >= 17 && currentHour < 21
          ? "evening"
          : "night";

      // Food recommendations based on weather
      const recommendations = {
        cold: {
          description: "Cold weather calls for warm, hearty meals",
          breakfast: [
            "Hot Paratha with Sabzi",
            "Sel Roti with Tea",
            "Hot Noodles/Soup",
            "Steaming Momo",
            "Puri Tarkari",
          ],
          lunch: [
            "Thakali Khana (Hot Nepali Thali)",
            "Hot Dal Bhat",
            "Tibetan Thukpa",
            "Hot Curry with Rice",
            "Momo (Steam fried)",
          ],
          dinner: [
            "Hot Nepali Thali",
            "Thukpa or Noodle Soup",
            "BBQ/ Sekuwa",
            "Hot Curry",
            "Steaming Momo",
          ],
          snack: ["Hot Tea/Milk", "Momos", "Sukuti", "Bhuteko Bhat"],
          beverages: ["Hot Ginger Tea", "Chiya", "Hot Lemon Honey"],
          nepaliBreakfast: [
            "तातो पराठा सब्जी",
            "सेल रोटी चिया",
            "तातो चाउचाउ",
            "तातो म:मो",
          ],
          nepaliLunch: [
            "थकाली खाना",
            "दाल भात",
            "तुखपा",
            "करी/भात",
          ],
          nepaliDinner: [
            "नेपाली थाली",
            "तुखपा",
            "सेकुवा",
            "म:मो",
          ],
          tip: "Perfect weather for hot, comforting Nepali dishes!",
        },
        rain: {
          description: "Rainy weather is perfect for hot, comforting foods",
          breakfast: [
            "Hot Porridge/Dhido",
            "Sel Roti with Tea",
            "Hot Momo",
            "Puri Bhaji",
          ],
          lunch: [
            "Thukpa (Tibetan Soup)",
            "Hot Curry with Rice",
            "Thenthuk",
            "Momo",
          ],
          dinner: [
            "Hot Soup Noodles",
            "Thakali Thali",
            "Steaming Momo",
            "BBQ (Indoor)",
          ],
          snack: ["Hot Pakora", "Momos", "Sukuti", "Bhuteko Bhat"],
          beverages: ["Hot Ginger Tea", "Chiya", "Hot Masala Milk"],
          nepaliBreakfast: [
            "तातो दही",
            "सेल रोटी",
            "तातो म:मो",
            "पुरी भाजी",
          ],
          nepaliLunch: ["तुखपा", "करी भात", "थेनथुक", "म:मो"],
          nepaliDinner: ["सुप नुडल्स", "थकाली थाली", "म:मो", "सेकुवा"],
          tip: "Rainy day? Hot soups and comfort foods are calling!",
        },
        hot: {
          description: "Hot weather - stay cool with lighter, refreshing foods",
          breakfast: [
            "Fruit Salad",
            "Cold Cereal with Milk",
            "Yogurt Parfait",
            "Light Smoothie Bowl",
          ],
          lunch: [
            "Chaat/Pani Puri",
            "Fresh Salad",
            "Cold Noodles",
            "Light Curry",
            "Sandwich/Wrap",
          ],
          dinner: [
            "Cold Soba Noodles",
            "BBQ/Grilled",
            "Fresh Spring Rolls",
            "Light Thali",
          ],
          snack: [
            "Fruit Bowl",
            "Ice Cream",
            "Cold Drinks",
            "Lassi",
          ],
          beverages: [
            "Cold Water",
            "Fresh Juice",
            "Lassi",
            "Cold Lemonade",
          ],
          nepaliBreakfast: [
            "फल सलाद",
            "दूध अनाज",
            "योगर्ट",
            "स्मूथी",
          ],
          nepaliLunch: ["चट", "फलफूल", "छिस्के नुडल्स", "लाइट करी"],
          nepaliDinner: ["ग्रिल्ड", "स्प्रिङ रोल्स", "हल्का थाली"],
          tip: "Hot weather - keep it light and refreshing! Hydrate well!",
        },
        cloudy: {
          description: "Cloudy weather - balanced options work well",
          breakfast: [
            "Regular Breakfast (Momo, Puri, etc.)",
            "Toast with Eggs",
            "Pancakes",
          ],
          lunch: [
            "Standard Nepali Thali",
            "Chow Mein",
            "Momo",
            "Fried Rice",
          ],
          dinner: [
            "BBQ/ Grilled",
            "Curry",
            "Standard Thali",
            "Momo",
          ],
          snack: ["Chatpate", "Momos", "Samosa", "Pakora"],
          beverages: ["Tea", "Coffee", "Juice", "Regular Drinks"],
          nepaliBreakfast: ["म:मो", "पुरी", "अण्डा टोस्ट"],
          nepaliLunch: ["दाल भात", "चाउचाउ", "म:मो"],
          nepaliDinner: ["सेकुवा", "करी", "थाली"],
          tip: "Balanced weather - any cuisine works!",
        },
        stormy: {
          description: "Stormy weather - stay indoors with comfort food",
          breakfast: [
            "Hot Breakfast",
            "Steaming Momo",
            "Hot Noodles",
          ],
          lunch: [
            "Hot Soup",
            "Thukpa",
            "Hot Curry",
            "Momo",
          ],
          dinner: [
            "Hot Comfort Food",
            "Soup Noodles",
            "Steaming Dishes",
          ],
          snack: ["Hot Tea", "Momos", "Bhuteko Bhat"],
          beverages: ["Hot Tea", "Chiya", "Hot Beverages"],
          nepaliBreakfast: ["तातो म:मो", "तातो नुडल्स"],
          nepaliLunch: ["सुप", "तुखपा", "म:मो"],
          nepaliDinner: ["कम्फर्ट खाना", "सुप नुडल्स"],
          tip: "Stay indoors and enjoy hot, comforting meals!",
        },
        clear: {
          description: "Clear weather - perfect for any cuisine",
          breakfast: [
            "Any Breakfast",
            "Momo",
            "Puri",
            "Toast",
          ],
          lunch: [
            "Any Cuisine",
            "Thali",
            "Chow Mein",
            "Momo",
          ],
          dinner: [
            "Any Dinner",
            "BBQ",
            "Curry",
            "Thali",
          ],
          snack: ["Any Snack", "Momos", "Chatpate"],
          beverages: ["Any Drink", "Tea", "Coffee", "Juice"],
          nepaliBreakfast: ["कुनै पनि", "म:मो", "पुरी"],
          nepaliLunch: ["कुनै पनि", "थाली", "म:मो"],
          nepaliDinner: ["कुनै पनि", "सेकुवा", "थाली"],
          tip: "Perfect weather - order whatever you crave!",
        },
      };

      // Select recommendations based on weather
      const weatherKey =
        condition === "clear"
          ? "clear"
          : condition === "rainy"
          ? "rain"
          : temperature < 10
          ? "cold"
          : temperature > 30
          ? "hot"
          : condition === "cloudy"
          ? "cloudy"
          : condition === "stormy"
          ? "stormy"
          : "clear";

      const rec = recommendations[weatherKey];

      // Get specific meal recommendations
      const mealRecs = mealType === "any" 
        ? rec.lunch 
        : rec[mealType] || rec.lunch;

      const nepaliMealRecs = mealType === "any"
        ? rec.nepaliLunch
        : rec[`nepali${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`] || rec.nepaliLunch;

      return {
        success: true,
        data: {
          weatherCondition: condition,
          temperature: temperature ? `${temperature}°C` : "unknown",
          timeOfDay: timeOfDay,
          mealType: mealType,
          recommendations: {
            description: rec.description,
            foods: mealRecs,
            foodsNepali: nepaliMealRecs,
            beverages: rec.beverages,
            tip: rec.tip,
          },
          message:
            weatherKey === "cold"
              ? `It's ${temperature}°C - perfect for hot, hearty ${mealType === "any" ? "meals" : mealType}!`
              : weatherKey === "hot"
              ? `It's ${temperature}°C - stay cool with light, refreshing ${mealType === "any" ? "foods" : mealType}!`
              : weatherKey === "rain"
              ? `Rainy weather calls for hot, comforting ${mealType === "any" ? "meals" : mealType}!`
              : `Great weather for ${mealType === "any" ? "any cuisine" : mealType}!`,
        },
      };
    } catch (error) {
      console.error("❌ Weather-based food suggestion failed:", error.message);
      return {
        success: false,
        error: error.message,
        data: {
          recommendations: null,
          message: "Unable to provide weather-based suggestions.",
        },
      };
    }
  },
};

