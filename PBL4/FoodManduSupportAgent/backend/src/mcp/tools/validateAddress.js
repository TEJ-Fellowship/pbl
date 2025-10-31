/**
 * MCP Tool: Validate Kathmandu Valley Address
 * Validates if an address is within Foodmandu delivery coverage in Kathmandu Valley
 */

export const validateAddress = {
  name: "validate_address",
  description:
    "Validate if an address is within Foodmandu delivery coverage in Kathmandu Valley and suggest corrections if needed",
  inputSchema: {
    type: "object",
    properties: {
      address: {
        type: "string",
        description: "Address to validate (area name or full address)",
      },
      lat: {
        type: "number",
        description: "Latitude (optional, for precise validation)",
      },
      lng: {
        type: "number",
        description: "Longitude (optional, for precise validation)",
      },
    },
    required: ["address"],
  },
  handler: async ({ address, lat, lng }) => {
    try {
      // Kathmandu Valley boundaries (approximate)
      const kathmanduValley = {
        minLat: 27.6,
        maxLat: 27.8,
        minLng: 85.2,
        maxLng: 85.45,
      };

      // Known delivery areas in Kathmandu Valley
      const deliveryAreas = [
        "thamel",
        "lazimpat",
        "durbarmarg",
        "durbar marg",
        "new road",
        "newroad",
        "asan",
        "indrachowk",
        "basantapur",
        "ratnapark",
        "maitighar",
        "thapathali",
        "tripureshwor",
        "kalimati",
        "balaju",
        "maharajgunj",
        "bansbari",
        "budhanilkantha",
        "tokha",
        "chabahil",
        "gaushala",
        "koteshwor",
        "tinkune",
        "sinamangal",
        "new baneshwor",
        "baneshwor",
        "anamnagar",
        "dillibazar",
        "putalisadak",
        "kamalpokhari",
        "hattigauda",
        "naxal",
        "battisputali",
        "gairidhara",
        "bouddha",
        "boudha",
        "jorpati",
        "sankhu",
        "bhaktapur",
        "thimi",
        "madhyapur",
        "suryabinayak",
        "lalitpur",
        "patan",
        "jawalakhel",
        "pulchowk",
        "kupondole",
        "sanepa",
        "jhamsikhel",
        "satdobato",
        "lagankhel",
        "ekantakuna",
        "gwarko",
        "imadol",
        "dhapakhel",
        "chapagaun",
        "lubhu",
        "godawari",
      ];

      const addressLower = address.toLowerCase().trim();

      // Check if address contains known area
      const matchedArea = deliveryAreas.find((area) =>
        addressLower.includes(area)
      );

      // Validate coordinates if provided
      let isWithinBounds = null;
      if (lat && lng) {
        isWithinBounds =
          lat >= kathmanduValley.minLat &&
          lat <= kathmanduValley.maxLat &&
          lng >= kathmanduValley.minLng &&
          lng <= kathmanduValley.maxLng;
      } else if (matchedArea) {
        // Try to geocode the address using Nominatim (OpenStreetMap)
        try {
          const geocodeResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
              address + ", Kathmandu, Nepal"
            )}&format=json&limit=1`,
            {
              headers: {
                "User-Agent": "FoodmanduSupportAgent/1.0",
              },
            }
          );

          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json();
            if (geocodeData.length > 0) {
              const location = geocodeData[0];
              lat = parseFloat(location.lat);
              lng = parseFloat(location.lon);
              isWithinBounds =
                lat >= kathmanduValley.minLat &&
                lat <= kathmanduValley.maxLat &&
                lng >= kathmanduValley.minLng &&
                lng <= kathmanduValley.maxLng;
            }
          }
        } catch (geocodeError) {
          console.warn("Geocoding failed:", geocodeError.message);
        }
      }

      // Determine validation result
      let isValid = false;
      let confidence = "low";
      let message = "";
      let suggestions = [];

      if (matchedArea) {
        isValid = true;
        confidence = isWithinBounds === false ? "medium" : "high";
        message = `Address appears to be in ${matchedArea}, which is within our delivery area.`;
      } else if (isWithinBounds === true) {
        isValid = true;
        confidence = "medium";
        message =
          "Address coordinates are within Kathmandu Valley delivery area.";
      } else if (isWithinBounds === false) {
        isValid = false;
        confidence = "high";
        message =
          "Address appears to be outside Kathmandu Valley delivery coverage.";
        suggestions = [
          "Please check if the address is within Kathmandu, Lalitpur, or Bhaktapur districts",
          "Try providing a more specific landmark or area name",
          "Contact support for areas on the outskirts of the valley",
        ];
      } else {
        // Fuzzy match for typos
        const possibleMatches = deliveryAreas.filter(
          (area) =>
            addressLower.includes(area.slice(0, 4)) ||
            area.includes(addressLower.slice(0, 4))
        );

        if (possibleMatches.length > 0) {
          isValid = true;
          confidence = "medium";
          message = `Address might be in delivery area. Did you mean: ${possibleMatches
            .slice(0, 3)
            .join(", ")}?`;
          suggestions = possibleMatches.slice(0, 5);
        } else {
          isValid = false;
          confidence = "low";
          message =
            "Unable to verify address. Please provide a more specific area name or landmark.";
          suggestions = [
            "Include well-known landmarks (e.g., 'near Civil Mall', 'opposite Patan Durbar Square')",
            "Specify the main area (e.g., Thamel, Patan, Bhaktapur)",
            "Provide GPS coordinates if available",
          ];
        }
      }

      return {
        success: true,
        data: {
          address: address,
          isValid: isValid,
          confidence: confidence, // low, medium, high
          inDeliveryArea: isValid,
          matchedArea: matchedArea || null,
          coordinates:
            lat && lng
              ? { lat: lat, lng: lng, verified: !!isWithinBounds }
              : null,
          message: message,
          suggestions: suggestions,
          coverage: {
            mainAreas: [
              "Kathmandu Metropolitan",
              "Lalitpur Metropolitan",
              "Bhaktapur Municipality",
              "Madhyapur Thimi",
            ],
            note: "Delivery available within Kathmandu Valley main areas",
          },
        },
      };
    } catch (error) {
      console.error("❌ Address validation failed:", error.message);
      return {
        success: false,
        error: error.message,
        data: {
          isValid: false,
          message: "Unable to validate address at this time.",
          suggestions: [
            "Please contact Foodmandu support for address verification",
          ],
        },
      };
    }
  },
};
