/**
 * MCP Tool: Get Regional Food Preferences
 * Provides location-based food preferences and recommendations for different regions of Nepal
 */

export const getRegionalPreferences = {
  name: "get_regional_preferences",
  description:
    "Get food preferences, typical orders, and cultural insights for specific regions in Nepal",
  inputSchema: {
    type: "object",
    properties: {
      region: {
        type: "string",
        description:
          "Region in Nepal (Kathmandu, Pokhara, Chitwan, Thamel, Patan, Boudha, etc.)",
      },
    },
  },
  handler: async ({ region = "Kathmandu" }) => {
    try {
      // Regional preferences database
      const regionalData = {
        // Major Cities
        Kathmandu: {
          areaType: "urban",
          typicalOrders: {
            popular: ["Momo", "Chow Mein", "Sekuwa", "Thakali Khana", "Pizza"],
            breakfast: ["Momo", "Samosa", "Poori Sabzi", "Paratha"],
            lunch: ["Thakali Thali", "Dal Bhat", "Chow Mein", "Momo"],
            dinner: ["Momo", "Sekuwa", "BBQ", "Western food"],
            snack: ["Momo", "Chatpate", "Sekuwa", "Samosa"],
          },
          preferences: {
            spicyLevel: "medium-high",
            cuisineTypes: ["Nepali", "Newari", "Thakali", "Tibetan", "Indian", "Western"],
            paymentMethods: ["Cash", "eSewa", "Khalti", "Card"],
            avgDeliveryTime: "35-50 minutes",
            peakHours: "7-9 AM (breakfast), 1-3 PM (lunch), 7-9 PM (dinner)",
          },
          culturalInsights: {
            description:
              "Kathmandu Valley - mix of traditional Newari cuisine and modern fast food",
            traditions: ["Momo for snacks", "Thakali for formal meals", "Sekuwa for BBQ nights"],
            popularAreas: ["Thamel (tourist)", "Durbar Marg (upscale)", "New Road (local)"],
          },
          recommendations:
            "Best for: Momo lovers, variety seekers. Avoid ordering during Dashain/Tihar - expect massive delays.",
        },
        Thamel: {
          areaType: "tourist",
          typicalOrders: {
            popular: ["Pizza", "Burger", "Momo", "Pasta", "Western breakfast"],
            breakfast: ["Continental", "English breakfast", "Momo", "Pancakes"],
            lunch: ["Pizza", "Pasta", "Sandwiches", "Momo"],
            dinner: ["BBQ", "Steak", "Italian", "Asian fusion", "Momo"],
            snack: ["Momos", "Fries", "Nachos", "Sandwiches"],
          },
          preferences: {
            spicyLevel: "low-medium",
            cuisineTypes: ["Western", "Italian", "Continental", "Nepali", "Tibetan"],
            paymentMethods: ["Cash", "Card", "Digital wallets"],
            avgDeliveryTime: "25-40 minutes",
            peakHours: "8-10 AM (breakfast), 12-2 PM (lunch), 7-9 PM (dinner)",
          },
          culturalInsights: {
            description:
              "Tourist hub - international food meets local flavors. Higher prices, more variety.",
            traditions: [
              "Evening dining culture",
              "International breakfast",
              "Late night BBQ",
            ],
            popularAreas: ["Bustling streets", "Roof-top restaurants", "Street stalls"],
          },
          recommendations:
            "Best for: International food, variety, quality. Expect higher prices and tourist crowds.",
        },
        Pokhara: {
          areaType: "urban",
          typicalOrders: {
            popular: ["Fresh Fish", "Momo", "Pancakes", "Thakali Khana", "Burgers"],
            breakfast: ["Western breakfast", "Pancakes", "Poori Sabzi", "Egg toast"],
            lunch: ["Fish curry", "Thakali Thali", "Dal Bhat", "Chow Mein"],
            dinner: ["Grilled fish", "Momo", "BBQ", "Indian food"],
            snack: ["Momo", "Roasted corn", "Local fruits", "Ice cream"],
          },
          preferences: {
            spicyLevel: "medium",
            cuisineTypes: ["Nepali", "Thakali", "Indian", "Western", "Tibetan"],
            paymentMethods: ["Cash", "eSewa", "Khalti"],
            avgDeliveryTime: "40-60 minutes",
            peakHours: "7-9 AM, 1-3 PM, 7-9 PM",
          },
          culturalInsights: {
            description:
              "Lakeside city - fresh local fish, mountain views, laid-back atmosphere",
            traditions: ["Fresh fish dishes", "Breakfast by the lake", "Sunset dining"],
            popularAreas: ["Lakeside", "Old Pokhara", "Durbar Marg"],
          },
          recommendations:
            "Best for: Fresh fish lovers, scenic dining. Try local Thakali and trout dishes.",
        },
        Patan: {
          areaType: "historical",
          typicalOrders: {
            popular: ["Samay Baji", "Choila", "Momo", "Newari Thali", "Sel Roti"],
            breakfast: ["Wo", "Chatamari", "Bara", "Egg bhaji"],
            lunch: ["Newari Thali", "Samay Baji", "Dal Bhat", "Momo"],
            dinner: ["Choila", "Sekuwa", "Newari platter", "Traditional feast"],
            snack: ["Chatamari", "Wo", "Bara", "Yomari"],
          },
          preferences: {
            spicyLevel: "high",
            cuisineTypes: ["Newari", "Nepali", "Traditional"],
            paymentMethods: ["Cash", "eSewa"],
            avgDeliveryTime: "30-45 minutes",
            peakHours: "Traditional meal times",
          },
          culturalInsights: {
            description:
              "Ancient city - birthplace of Newari culture, authentic traditional food",
            traditions: [
              "Newari feast culture",
              "Juju Dhau (King Curd)",
              "Traditional festivals",
            ],
            popularAreas: ["Durbar Square", "Traditional alleys", "Mangal Bazaar"],
          },
          recommendations:
            "Best for: Authentic Newari food, traditional experience. Must try: Samay Baji, Choila!",
        },
        Boudha: {
          areaType: "religious",
          typicalOrders: {
            popular: ["Momo", "Tibetan Thukpa", "Thenthuk", "Laphing", "Momos"],
            breakfast: ["Tibetan bread", "Tsampa porridge", "Butter tea"],
            lunch: ["Thukpa", "Momo", "Tibetan Thali", "Vegetarian"],
            dinner: ["Thenthuk", "Laphing", "Momo", "Tibetan feast"],
            snack: ["Momo", "Laphing", "Fried bread", "Tea"],
          },
          preferences: {
            spicyLevel: "medium",
            cuisineTypes: ["Tibetan", "Nepali", "Vegetarian"],
            paymentMethods: ["Cash", "eSewa"],
            avgDeliveryTime: "25-40 minutes",
            peakHours: "Around meal times, post-circumambulation",
          },
          culturalInsights: {
            description:
              "Tibetan Buddhist enclave - Tibetan and Sherpa cuisine, vegetarian options",
            traditions: [
              "Monastery lunch culture",
              "Circumambulation breaks",
              "Butter tea tradition",
            ],
            popularAreas: ["Around stupa", "Monastery cafes", "Tibetan restaurants"],
          },
          recommendations:
            "Best for: Tibetan food, vegetarian options, authentic Momo. Many places close during prayer times.",
        },
        Chitwan: {
          areaType: "terai",
          typicalOrders: {
            popular: ["Dal Bhat", "Fish curry", "Vegetable curry", "Rice dishes"],
            breakfast: ["Poori", "Paratha", "Poha", "Idli"],
            lunch: ["Thali", "Dal Bhat", "Biryani", "Rice with curry"],
            dinner: ["Fish curry", "Local specialties", "Dal Bhat", "Rice dishes"],
            snack: ["Samosa", "Pakora", "Chat", "Litti"],
          },
          preferences: {
            spicyLevel: "medium-high",
            cuisineTypes: ["Terai", "Indian", "Nepali", "Tharu"],
            paymentMethods: ["Cash", "eSewa"],
            avgDeliveryTime: "45-60 minutes",
            peakHours: "Terai meal times",
          },
          culturalInsights: {
            description:
              "Terai plains - rice-heavy meals, Indian influence, Tharu indigenous cuisine",
            traditions: ["Rice-based meals", "Spicy curries", "Tharu feast"],
            popularAreas: ["Sauraha", "Local markets", "Tourist areas"],
          },
          recommendations:
            "Best for: Rice lovers, Indian flavors, traditional Terai food.",
        },
        // Generic fallback
        Nepal: {
          areaType: "countrywide",
          typicalOrders: {
            popular: ["Momo", "Dal Bhat", "Chow Mein", "Thakali Khana"],
            breakfast: ["Momo", "Poori", "Paratha"],
            lunch: ["Dal Bhat", "Momo", "Thali"],
            dinner: ["Momo", "Curry", "BBQ"],
            snack: ["Momo", "Chatpate", "Samosa"],
          },
          preferences: {
            spicyLevel: "medium",
            cuisineTypes: ["Nepali", "Indian", "Tibetan", "Western"],
            paymentMethods: ["Cash", "eSewa", "Khalti", "Card"],
            avgDeliveryTime: "30-50 minutes",
            peakHours: "Traditional Nepali meal times",
          },
          culturalInsights: {
            description: "Nepal - diverse cuisine across regions and communities",
            traditions: ["Momo culture", "Dal Bhat staple", "Festive feasts"],
            popularAreas: ["Across regions"],
          },
          recommendations: "Nepali food culture varies by region and community.",
        },
      };

      // Normalize region name
      const regionKey =
        Object.keys(regionalData).find(
          (key) => key.toLowerCase() === region.toLowerCase()
        ) || "Kathmandu";

      const data = regionalData[regionKey];
      return {
        success: true,
        data: {
          region: regionKey,
          areaType: data.areaType,
          typicalOrders: data.typicalOrders,
          preferences: data.preferences,
          culturalInsights: data.culturalInsights,
          recommendation: data.recommendations,
        },
      };
    } catch (error) {
      console.error("❌ Regional preferences failed:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

