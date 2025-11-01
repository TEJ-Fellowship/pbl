import {
  format,
  isAfter,
  isBefore,
  addDays,
  subDays,
  parseISO,
} from "date-fns";

/**
 * DateTime Tool for PayPal Support
 * Handles time queries with location-based time support
 */

export class DateTimeService {
  constructor() {
    // Common location to timezone mappings
    this.locationTimezones = {
      // Countries
      nepal: "Asia/Kathmandu",
      india: "Asia/Kolkata",
      us: "America/New_York",
      "united states": "America/New_York",
      usa: "America/New_York",
      uk: "Europe/London",
      "united kingdom": "Europe/London",
      australia: "Australia/Sydney",
      canada: "America/Toronto",
      japan: "Asia/Tokyo",
      china: "Asia/Shanghai",
      germany: "Europe/Berlin",
      france: "Europe/Paris",
      brazil: "America/Sao_Paulo",
      mexico: "America/Mexico_City",

      // Cities
      "new york": "America/New_York",
      "los angeles": "America/Los_Angeles",
      chicago: "America/Chicago",
      london: "Europe/London",
      tokyo: "Asia/Tokyo",
      sydney: "Australia/Sydney",
      dubai: "Asia/Dubai",
      singapore: "Asia/Singapore",
      kathmandu: "Asia/Kathmandu",
      delhi: "Asia/Kolkata",
      mumbai: "Asia/Kolkata",
    };

    this.defaultTimezone = "UTC";
  }

  /**
   * Check if query is about time/date
   */
  isTimeQuery(query) {
    const timeKeywords = [
      /time/i,
      /date/i,
      /now/i,
      /currently/i,
      /what.*time/i,
      /current.*time/i,
      /local.*time/i,
      /timezone/i,
      /time.*zone/i,
      /business.*hours/i,
      /when.*is/i,
      /what.*day/i,
    ];

    return timeKeywords.some((pattern) => pattern.test(query));
  }

  /**
   * Extract location from query
   */
  extractLocation(query) {
    const queryLower = query.toLowerCase();

    // Look for "in [location]" or "at [location]"
    const locationPatterns = [
      /(?:time|date).*?(?:in|at|for)\s+([a-z\s]+?)(?:\s|$|\.|,|\?)/i,
      /(?:in|at|for)\s+([a-z\s]+?)\s+(?:time|now)/i,
    ];

    for (const pattern of locationPatterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        const location = match[1].trim().toLowerCase();
        // Clean up common words
        const cleaned = location
          .replace(/\b(the|a|an|is|are|was|were)\b/g, "")
          .trim();
        return cleaned;
      }
    }

    // Direct location mentions
    for (const [key, tz] of Object.entries(this.locationTimezones)) {
      if (queryLower.includes(key)) {
        return key;
      }
    }

    return null;
  }

  /**
   * Get timezone for location
   */
  getTimezoneForLocation(location) {
    if (!location) return this.defaultTimezone;

    const locationLower = location.toLowerCase().trim();

    // Direct match
    if (this.locationTimezones[locationLower]) {
      return this.locationTimezones[locationLower];
    }

    // Partial match
    for (const [key, tz] of Object.entries(this.locationTimezones)) {
      if (locationLower.includes(key) || key.includes(locationLower)) {
        return tz;
      }
    }

    return this.defaultTimezone;
  }

  /**
   * Get current time for a location/timezone
   */
  getCurrentTime(timezone = "UTC", location = null) {
    try {
      const now = new Date();

      // Format time in the specified timezone
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      const dateFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const timeFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      const formattedDateTime = formatter.format(now);
      const formattedDate = dateFormatter.format(now);
      const formattedTime = timeFormatter.format(now);

      // Get timezone offset info
      const utcDate = new Date(
        now.toLocaleString("en-US", { timeZone: "UTC" })
      );
      const tzDate = new Date(
        now.toLocaleString("en-US", { timeZone: timezone })
      );
      const offsetMs = tzDate - utcDate;
      const offsetHours = offsetMs / (1000 * 60 * 60);
      const offsetSign = offsetHours >= 0 ? "+" : "";
      const offsetStr = `UTC${offsetSign}${offsetHours}`;

      // Use date-fns for additional readable formatting
      // Note: date-fns format() doesn't support timeZone option
      // So we format the current time (Intl already handled timezone conversion above)
      // The formattedReadable and formattedShort use date-fns for consistent formatting
      const formattedReadable = format(now, "EEEE, MMMM do, yyyy 'at' h:mm a");
      const formattedShort = format(now, "MMM dd, yyyy HH:mm");

      return {
        location: location || timezone,
        timezone: timezone,
        dateTime: formattedDateTime,
        date: formattedDate,
        time: formattedTime,
        timestamp: now.toISOString(),
        offset: offsetStr,
        unix: Math.floor(now.getTime() / 1000),
        formattedReadable,
        formattedShort,
      };
    } catch (error) {
      console.error("Error getting time for timezone:", timezone, error);
      // Fallback to UTC
      return this.getCurrentTime("UTC", "UTC");
    }
  }

  /**
   * Execute date/time query
   */
  async execute(query, location = null) {
    try {
      console.log(`⏰ DateTime Tool: Processing "${query}"`);

      let timezone = this.defaultTimezone;
      let locationName = null;

      if (location) {
        timezone = this.getTimezoneForLocation(location);
        locationName = location;
      } else {
        // Extract location from query
        const extractedLocation = this.extractLocation(query);
        if (extractedLocation) {
          timezone = this.getTimezoneForLocation(extractedLocation);
          locationName = extractedLocation;
        }
      }

      const timeInfo = this.getCurrentTime(timezone, locationName);

      // Format response
      let response = `⏰ **Current Time Information**\n\n`;

      if (locationName && locationName !== timezone) {
        response += `📍 Location: ${
          locationName.charAt(0).toUpperCase() + locationName.slice(1)
        }\n`;
      }

      response += `🕐 Time: ${timeInfo.time}\n`;
      response += `📅 Date: ${timeInfo.date}\n`;
      response += `🌍 Timezone: ${timezone}\n`;
      response += `⏱️ Offset: ${timeInfo.offset}\n\n`;
      response += `📊 Full DateTime: ${timeInfo.dateTime}`;

      return {
        success: true,
        timeInfo,
        message: response,
      };
    } catch (error) {
      console.error("❌ DateTime Tool Error:", error);
      return {
        success: false,
        error: error.message,
        message: `Error getting time information: ${error.message}`,
      };
    }
  }
}

export default DateTimeService;
