/**
 * MCP Tool: Check Festival Schedule and Impact
 * Checks if today is a Nepali festival with high order volume expectations
 */

export const checkFestivalSchedule = {
  name: "check_festival_schedule",
  description:
    "Check if current or specified date is during a Nepali festival with expected high order volumes, returns festival info and impact on deliveries",
  inputSchema: {
    type: "object",
    properties: {
      date: {
        type: "string",
        description: "Date to check in YYYY-MM-DD format. Defaults to today",
      },
    },
  },
  handler: async ({ date }) => {
    try {
      // Parse date or use today
      let checkDate;
      if (date) {
        checkDate = new Date(date);
      } else {
        checkDate = new Date();
      }

      // Get date in YYYY-MM-DD format
      const dateString = checkDate.toISOString().split("T")[0];

      // Nepali festivals calendar (using 2025 dates - adjust annually)
      const festivals = {
        "2025-01-11": {
          name: "Maghe Sankranti",
          nepaliName: "माघे संक्रान्ति",
          impact: "high",
          description: "Makar Sankranti - marks winter solstice",
          typicalOrders: "Sel roti, sesame sweets, sweets",
        },
        "2025-02-09": {
          name: "Sonam Lhosar",
          nepaliName: "सोनाम ल्होसार",
          impact: "medium",
          description: "Tamu (Gurung) New Year",
          typicalOrders: "New Year feast dishes, dumplings",
        },
        "2025-02-21": {
          name: "Tamu Lhosar",
          nepaliName: "तामु ल्होसार",
          impact: "medium",
          description: "Tamang New Year",
          typicalOrders: "Traditional New Year cuisine",
        },
        "2025-03-08": {
          name: "Shivaratri",
          nepaliName: "शिवरात्री",
          impact: "medium",
          description: "Lord Shiva's night festival",
          typicalOrders: "Chhang, cannabis-infused sweets (legally used in festivals)",
        },
        "2025-03-29": {
          name: "Holi",
          nepaliName: "होली",
          impact: "high",
          description: "Festival of Colors",
          typicalOrders: "Color powder packages, sweets, drinks",
        },
        "2025-04-01": {
          name: "Ram Navami",
          nepaliName: "राम नवमी",
          impact: "low",
          description: "Lord Rama's birthday",
          typicalOrders: "Prasad, vegetarian offerings",
        },
        "2025-04-27": {
          name: "Buddha Jayanti",
          nepaliName: "बुद्ध जयन्ती",
          impact: "high",
          description: "Buddha's birthday - UNESCO World Heritage sites busy",
          typicalOrders: "Vegetarian food, Boudhanath/Swayambhunath visit packages",
        },
        "2025-08-26": {
          name: "Janai Purnima",
          nepaliName: "जनै पूर्णिमा",
          impact: "medium",
          description: "Sacred thread festival",
          typicalOrders: "Kwati (mixed bean soup), traditional food",
        },
        "2025-09-18": {
          name: "Indra Jatra",
          nepaliName: "इन्द्र जात्रा",
          impact: "very_high",
          description: "Kathmandu's biggest street festival",
          typicalOrders: "Massive demand - snacks, drinks, traditional food",
        },
        "2025-09-22": {
          name: "Yomari Punhi",
          nepaliName: "योमरी पुन्हि",
          impact: "high",
          description: "Newar New Year - Yomari festival",
          typicalOrders: "Yomari (steamed sweet dumpling)",
        },
        "2025-10-10": {
          name: "Dashain",
          nepaliName: "दशैं",
          impact: "extreme",
          description: "Nepal's biggest festival - 15 days of celebration",
          typicalOrders: "Massive demand - meat, sweets, traditional foods throughout 15 days",
          extendedPeriod: true,
          peakDays: ["2025-10-10", "2025-10-12", "2025-10-18", "2025-10-20"],
        },
        "2025-10-15": {
          name: "Tihar",
          nepaliName: "तिहार",
          impact: "very_high",
          description: "Festival of Lights - 5 days celebration",
          typicalOrders: "Sweets, Diwali lights, candles, traditional sweets throughout 5 days",
          extendedPeriod: true,
          peakDays: ["2025-10-15", "2025-10-16", "2025-10-19"],
        },
        "2025-12-09": {
          name: "Muktinath Jayanti",
          nepaliName: "मुक्तिनाथ जयन्ती",
          impact: "low",
          description: "Muktinath temple festival",
          typicalOrders: "Pilgrimage food",
        },
      };

      // Check exact date
      let festival = festivals[dateString];

      // Check for extended festival periods (Dashain and Tihar)
      if (!festival) {
        // For Dashain (10/10 - check if within 15 days)
        const dashainStart = new Date("2025-10-10");
        const dashainEnd = new Date("2025-10-25");
        if (checkDate >= dashainStart && checkDate <= dashainEnd) {
          festival = {
            name: "Dashain",
            nepaliName: "दशैं",
            impact: "extreme",
            description: "Dashain festival period (15 days)",
            typicalOrders: "High demand for traditional foods and meats",
            isExtendedPeriod: true,
          };
        }

        // For Tihar (10/15 - check if within 5 days)
        const tiharStart = new Date("2025-10-15");
        const tiharEnd = new Date("2025-10-20");
        if (checkDate >= tiharStart && checkDate <= tiharEnd) {
          festival = {
            name: "Tihar",
            nepaliName: "तिहार",
            impact: "very_high",
            description: "Tihar festival period (5 days)",
            typicalOrders: "High demand for sweets and celebration items",
            isExtendedPeriod: true,
          };
        }
      }

      // Calculate order volume multiplier based on impact
      const volumeMultipliers = {
        low: 1.2,
        medium: 1.5,
        high: 2.0,
        very_high: 3.0,
        extreme: 4.0,
      };

      const volumeMultiplier = festival
        ? volumeMultipliers[festival.impact]
        : 1.0;

      // Generate recommendations
      let recommendation = "";
      if (festival) {
        recommendation =
          festival.impact === "extreme" || festival.impact === "very_high"
            ? `🍽️ ${festival.name} festival is currently ongoing! Expect ${volumeMultiplier}x normal order volume. Advise customers of potential delays and recommend ordering earlier in the day.`
            : festival.impact === "high"
            ? `🎉 ${festival.name} is today! Expect increased orders. Prepare for ${volumeMultiplier}x normal volume.`
            : `🌸 ${festival.name} festival - slight increase in orders expected (${volumeMultiplier}x normal).`;
      } else {
        recommendation = "No major festivals today. Normal delivery volume expected.";
      }

      return {
        success: true,
        data: {
          date: dateString,
          isFestival: !!festival,
          festival: festival || null,
          orderVolume: {
            multiplier: volumeMultiplier,
            impact: festival?.impact || "normal",
            message: festival
              ? `Expect ${volumeMultiplier}x normal order volume`
              : "Normal order volume expected",
          },
          recommendation: recommendation,
          typicalFoods: festival?.typicalOrders || null,
        },
      };
    } catch (error) {
      console.error("❌ Festival check failed:", error.message);
      return {
        success: false,
        error: error.message,
        data: {
          date: date || new Date().toISOString().split("T")[0],
          isFestival: false,
          festival: null,
          orderVolume: {
            multiplier: 1.0,
            impact: "unknown",
            message: "Unable to check festival schedule",
          },
        },
      };
    }
  },
};

