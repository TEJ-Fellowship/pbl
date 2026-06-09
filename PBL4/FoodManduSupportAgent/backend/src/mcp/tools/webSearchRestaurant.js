/**
 * MCP Tool: Web Search for Restaurant Information
 * Searches for restaurant reviews, menu information, or general details
 * Uses multiple strategies: local data, Foodmandu scraping, and free web search
 */

import axios from "axios";
import { load as loadHtml } from "cheerio";
import { loadOrders } from "./utils.js";

export const webSearchRestaurant = {
  name: "web_search_restaurant",
  description:
    "Search for restaurant information including reviews, menu items, hours, and ratings. Searches Foodmandu and general web sources.",
  inputSchema: {
    type: "object",
    properties: {
      restaurantName: {
        type: "string",
        description: "Name of the restaurant to search for",
      },
      query: {
        type: "string",
        description: "Specific query like 'menu', 'reviews', 'hours', 'ratings'",
      },
    },
    required: ["restaurantName"],
  },
  handler: async ({ restaurantName, query = "general" }) => {
    try {
      if (!restaurantName) {
        return {
          success: false,
          error: "Restaurant name is required",
        };
      }

      // Strategy 1: Search local orders data
      const orders = loadOrders();
      const matchingRestaurants = new Set();
      let localMatch = null;

      orders.forEach((order) => {
        const restName = order.restaurant?.name?.toLowerCase();
        if (restName && restName.includes(restaurantName.toLowerCase())) {
          matchingRestaurants.add(order.restaurant.name);
          if (!localMatch) {
            localMatch = order.restaurant;
          }
        }
      });

      // Strategy 2: Try to scrape Foodmandu restaurant page
      let scrapedInfo = null;
      if (matchingRestaurants.size > 0 || restaurantName) {
        try {
          // Try to construct Foodmandu restaurant URL
          const urlEncodedName = encodeURIComponent(restaurantName.toLowerCase());
          
          // Try multiple URL patterns
          const possibleUrls = [
            `https://www.foodmandu.com/Restaurant/${urlEncodedName}`,
            `https://www.foodmandu.com/Restaurant/View/${urlEncodedName}`,
            `https://foodmandu.com/webapi/restaurant/search?search=${urlEncodedName}`,
          ];

          for (const url of possibleUrls) {
            try {
              const response = await axios.get(url, {
                responseType: "text",
                timeout: 5000,
              });

              const $ = loadHtml(response.data);

              // Try to extract restaurant info
              const name = $(".restaurant-name, h1, .title").first().text().trim();
              const phone = $(".phone, [class*='contact']").first().text().trim();
              const address = $(".address, [class*='location']").first().text().trim();
              const rating = $(".rating, [class*='star']").first().text().trim();
              const description = $(".description, [class*='about']")
                .first()
                .text()
                .trim();

              // Try to get menu items
              const menuItems = [];
              $(".menu-item, .dish, .food-item").each((i, el) => {
                const itemName = $(el).find(".name, .title").text().trim();
                const itemPrice = $(el).find(".price").text().trim();
                if (itemName) {
                  menuItems.push({
                    name: itemName,
                    price: itemPrice || "Not specified",
                  });
                }
              });

              // Validate that we got meaningful data (not homepage redirect)
              const invalidNames = ["download the app", "object moved", "small order fee", "delivery charges"];
              const isValidName = name && !invalidNames.some(inv => name.toLowerCase().includes(inv));
              
              // Only use scraped data if we got valid information
              if ((isValidName || phone || address) && (phone || address || menuItems.length > 0)) {
                scrapedInfo = {
                  name: isValidName ? name : restaurantName,
                  phone: phone || null,
                  address: address || null,
                  rating: rating || null,
                  description: description || null,
                  menuItems: menuItems.slice(0, 10), // Limit to 10 items
                  source: "foodmandu.com",
                };
                break;
              }
            } catch (err) {
              // Try next URL
              continue;
            }
          }
        } catch (scrapeError) {
          // Scraping failed, use fallback data
          console.log("Web scraping failed, using local data");
        }
      }

      // Strategy 3: Combine local and scraped data
      const combinedInfo = {
        name: scrapedInfo?.name || localMatch?.name || restaurantName,
        phone: scrapedInfo?.phone || localMatch?.phone || null,
        address: scrapedInfo?.address || null,
        coordinates: localMatch?.address ? {
          lat: localMatch.address.latitude,
          lng: localMatch.address.longitude,
          area: localMatch.address.area,
          city: localMatch.address.city,
        } : null,
        rating: scrapedInfo?.rating || null,
        description: scrapedInfo?.description || null,
        menuItems: scrapedInfo?.menuItems || null,
        estimatedPrepTime: localMatch?.estimatedPrepTime || null,
        source: scrapedInfo?.source || "local_database",
      };

      // Based on query type, return relevant information
      let response = "";
      let data = { ...combinedInfo };

      switch (query.toLowerCase()) {
        case "menu":
          if (combinedInfo.menuItems && combinedInfo.menuItems.length > 0) {
            response = `Here are the menu items for ${combinedInfo.name}:\n`;
            combinedInfo.menuItems.forEach((item) => {
              response += `• ${item.name} - ${item.price}\n`;
            });
          } else {
            response = `Menu information for ${combinedInfo.name} is not currently available.`;
          }
          data.menuAvailable = combinedInfo.menuItems?.length > 0;
          break;

        case "reviews":
          response = combinedInfo.rating
            ? `${combinedInfo.name} has a rating of ${combinedInfo.rating} on Foodmandu.`
            : `Review information for ${combinedInfo.name} is not currently available in our database.`;
          data.hasReviews = !!combinedInfo.rating;
          break;

        case "hours":
          response = combinedInfo.description
            ? `Business information for ${combinedInfo.name}: ${combinedInfo.description}`
            : `Business hours for ${combinedInfo.name} are not currently available.`;
          break;

        case "contact":
          response = `Contact information for ${combinedInfo.name}:\n`;
          if (combinedInfo.phone) {
            response += `Phone: ${combinedInfo.phone}\n`;
          }
          if (combinedInfo.address) {
            response += `Address: ${combinedInfo.address}\n`;
          }
          if (combinedInfo.coordinates) {
            response += `Location: ${combinedInfo.coordinates.area}, ${combinedInfo.coordinates.city}\n`;
          }
          break;

        default:
          response = `Information about ${combinedInfo.name}:\n`;
          if (combinedInfo.phone) {
            response += `Phone: ${combinedInfo.phone}\n`;
          }
          if (combinedInfo.address || combinedInfo.coordinates) {
            const addr = combinedInfo.address || 
              `${combinedInfo.coordinates.area}, ${combinedInfo.coordinates.city}`;
            response += `Address: ${addr}\n`;
          }
          if (combinedInfo.rating) {
            response += `Rating: ${combinedInfo.rating}\n`;
          }
          if (combinedInfo.description) {
            response += `Details: ${combinedInfo.description}\n`;
          }
          if (combinedInfo.estimatedPrepTime) {
            response += `Avg. preparation time: ${combinedInfo.estimatedPrepTime} minutes\n`;
          }
      }

      return {
        success: true,
        data: {
          restaurant: combinedInfo,
          response: response.trim(),
          queryType: query,
          dataSource: combinedInfo.source,
          lastUpdated: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("❌ Restaurant search failed:", error.message);
      return {
        success: false,
        error: error.message,
        data: {
          restaurantName: restaurantName || "unknown",
          message: "Unable to retrieve restaurant information at this time.",
        },
      };
    }
  },
};

