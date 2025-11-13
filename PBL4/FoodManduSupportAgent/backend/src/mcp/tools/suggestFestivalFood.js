/**
 * MCP Tool: Suggest Festival Food
 * Suggests traditional Nepali foods based on festival or region
 */

export const suggestFestivalFood = {
  name: "suggest_festival_food",
  description:
    "Suggest traditional Nepali festival foods or regional preferences based on festival name, region, or occasion",
  inputSchema: {
    type: "object",
    properties: {
      festival: {
        type: "string",
        description:
          "Festival name (Dashain, Tihar, Holi, etc.) or 'regional' for local food preferences",
      },
      region: {
        type: "string",
        description:
          "Region in Nepal (Kathmandu, Pokhara, Terai, Hills, etc.) - only used if festival='regional'",
      },
    },
  },
  handler: async ({ festival, region = "Kathmandu" }) => {
    try {
      // Festival-specific foods
      const festivalFoods = {
        Dashain: {
          english: [
            "Chicken Curry",
            "Mutton Curry",
            "Goat Meat",
            "Sel Roti (Nepali doughnut)",
            "Masu (Meat curry)",
            "Butter Chicken",
          ],
          nepali: [
            "कुखुराको मासु (Chicken Curry)",
            "खसिको मासु (Mutton Curry)",
            "छाडि (Goat Meat)",
            "सेल रोटी (Sel Roti)",
            "मासु कुरा (Masu)",
          ],
          description:
            "Dashain is meat-heavy! Families sacrifice animals and feast on meat dishes.",
          restaurants: ["Sekuwa houses", "BBQ joints", "Traditional Nepali restaurants"],
        },
        Tihar: {
          english: [
            "Sel Roti",
            "Lakhamari",
            "Anarsa",
            "Barfi",
            "Peda",
            "Sweets assortment",
            "Gulab Jamun",
          ],
          nepali: [
            "सेल रोटी (Sel Roti)",
            "लखमरी (Lakhamari)",
            "अनर्सा (Anarsa)",
            "बरफी (Barfi)",
            "पेडा (Peda)",
            "मिठाईहरु (Assorted sweets)",
            "गुलाब जामुन (Gulab Jamun)",
          ],
          description:
            "Festival of Lights is all about sweets! Families share and gift sweets.",
          restaurants: ["Sweet shops", "Mithai vendors", "Indian-Nepali restaurants"],
        },
        Holi: {
          english: ["Color powders", "Gujiya", "Bhang Pakoras", "Thandai", "Beverages"],
          nepali: [
            "रंग पाउडर (Color powders)",
            "गुजिया (Gujiya)",
            "भाङ पकोडा (Bhang Pakoras)",
            "ठण्डाई (Thandai)",
            "पेय पदार्थ (Beverages)",
          ],
          description: "Festival of colors - snacks and drinks to enjoy while playing!",
          restaurants: ["Street vendors", "Cafes", "Fast food places"],
        },
        Indra: {
          english: [
            "Samay Baji (Newari platter)",
            "Choila (Spiced meat)",
            "Wo (Lentil pancake)",
            "Chatamari (Rice crepe)",
            "Juju Dhau (King Curd)",
          ],
          nepali: [
            "समाय बजी (Newari platter)",
            "चोयला (Spiced meat)",
            "वो (Lentil pancake)",
            "चतामारी (Rice crepe)",
            "जुजु धौ (King Curd)",
          ],
          description:
            "Kathmandu's biggest street festival - Newari traditional foods reign!",
          restaurants: ["Newari restaurants", "Street food in Basantapur", "Traditional eateries"],
        },
        "Buddha Jayanti": {
          english: [
            "Vegetarian Thali",
            "Momos (veg)",
            "Dal Bhat",
            "Curry without meat",
            "Vegetarian snacks",
          ],
          nepali: [
            "शाकाहारी थाली (Vegetarian Thali)",
            "म:मो (veg)",
            "दाल भात (Dal Bhat)",
            "शाकाहारी करी",
            "शाकाहारी खाजा",
          ],
          description:
            "Buddha's birthday - many people go vegetarian out of respect.",
          restaurants: ["Vegetarian restaurants", "Monasteries", "Buddhist restaurants"],
        },
        regional: {
          Kathmandu: {
            english: ["Momo", "Chow Mein", "Samay Baji", "Thakali Khana", "Sekuwa"],
            nepali: [
              "म:मो (Momo)",
              "चाउचाउ (Chow Mein)",
              "समाय बजी (Samay Baji)",
              "थकाली खाना (Thakali Khana)",
              "सेकुवा (Sekuwa)",
            ],
            description:
              "Kathmandu loves momo, chow mein, and Newari-Thakali fusion cuisine.",
          },
          Pokhara: {
            english: [
              "Lakeside Momo",
              "Fresh Fish",
              "Pokhara Thali",
              "Western breakfast",
              "Thakali Khana",
            ],
            nepali: [
              "म:मो (Momo)",
              "ताजा माछा (Fresh Fish)",
              "पोखरा थाली (Pokhara Thali)",
              "अन्तर्राष्ट्रिय खाना (Western)",
              "थकाली खाना (Thakali Khana)",
            ],
            description:
              "Pokhara has international tourist food plus local Thakali and fresh fish.",
          },
          Terai: {
            english: [
              "Dal Bhat with Tarkaari",
              "Samosa",
              "Golgappa",
              "Litti Chokha",
              "Rice-based dishes",
            ],
            nepali: [
              "दाल भात तरकारी (Dal Bhat with vegetables)",
              "समोसा (Samosa)",
              "गोलगप्पा (Golgappa)",
              "लिट्टी चोखा (Litti Chokha)",
              "चामलको खाना (Rice dishes)",
            ],
            description:
              "Terai region prefers North Indian-influenced foods and rice-heavy meals.",
          },
          Hills: {
            english: [
              "Dhindo",
              "Buckwheat pancakes",
              "Nepali Thali",
              "Local grain dishes",
              "Traditional soups",
            ],
            nepali: [
              "ढिंडो (Dhindo)",
              "पित्थो (Buckwheat)",
              "नेपाली थाली (Nepali Thali)",
              "स्थानीय अनाज (Local grains)",
              "राँस (Traditional soups)",
            ],
            description:
              "Mountain regions prefer traditional grains like buckwheat, millet, and dhindo.",
          },
        },
      };

      // Handle festival suggestions
      if (festival && festival.toLowerCase() !== "regional") {
        const festivalKey =
          Object.keys(festivalFoods).find(
            (key) => key.toLowerCase() === festival.toLowerCase()
          ) || null;

        if (!festivalKey || !festivalFoods[festivalKey]) {
          return {
            success: false,
            error: `Festival '${festival}' not found`,
            data: {
              availableFestivals: Object.keys(festivalFoods).filter(
                (k) => k !== "regional"
              ),
            },
          };
        }

        const foods = festivalFoods[festivalKey];
        return {
          success: true,
          data: {
            festival: festivalKey,
            recommendation: `${festivalKey} festival food suggestions:`,
            foods: foods.english,
            foodsNepali: foods.nepali,
            description: foods.description,
            restaurantTypes: foods.restaurants,
          },
        };
      }

      // Handle regional suggestions
      const regionKey =
        Object.keys(festivalFoods.regional).find(
          (key) => key.toLowerCase() === region.toLowerCase()
        ) || "Kathmandu";

      const regionalFoods = festivalFoods.regional[regionKey];
      return {
        success: true,
        data: {
          region: regionKey,
          recommendation: `Food preferences in ${regionKey}:`,
          foods: regionalFoods.english,
          foodsNepali: regionalFoods.nepali,
          description: regionalFoods.description,
        },
      };
    } catch (error) {
      console.error("❌ Festival food suggestion failed:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

