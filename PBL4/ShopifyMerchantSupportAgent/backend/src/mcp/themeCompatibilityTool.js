import axios from "axios";

/**
 * Theme Compatibility Checker MCP Tool for Shopify Merchant Support Agent
 * Validates if apps work with merchant's theme
 */
export class ThemeCompatibilityTool {
  constructor() {
    this.name = "theme_compatibility";
    this.description = "Check theme compatibility for Shopify apps and features";
    this.timeout = 10000; // 10 seconds timeout
    this.themeDatabase = new Map();
    this.appDatabase = new Map();
    this.initializeDatabases();
  }

  /**
   * Initialize theme and app databases
   */
  initializeDatabases() {
    // Popular Shopify themes and their characteristics
    this.themeDatabase.set("dawn", {
      name: "Dawn",
      version: "12.0.0",
      type: "free",
      features: ["responsive", "mobile-first", "accessibility", "performance"],
      compatibility: {
        apps: ["shopify-pay", "shopify-shipping", "shopify-analytics"],
        features: ["product-reviews", "wishlist", "quick-buy", "cart-drawer"],
        limitations: ["custom-sections", "advanced-styling"],
      },
      requirements: {
        shopify_plan: "basic",
        liquid_version: "5.0",
        browser_support: ["chrome", "firefox", "safari", "edge"],
      },
    });

    this.themeDatabase.set("brooklyn", {
      name: "Brooklyn",
      version: "2.0.0",
      type: "free",
      features: ["responsive", "mobile-first", "accessibility"],
      compatibility: {
        apps: ["shopify-pay", "shopify-shipping"],
        features: ["product-reviews", "wishlist"],
        limitations: ["custom-sections", "advanced-styling", "performance"],
      },
      requirements: {
        shopify_plan: "basic",
        liquid_version: "4.0",
        browser_support: ["chrome", "firefox", "safari", "edge"],
      },
    });

    this.themeDatabase.set("debut", {
      name: "Debut",
      version: "1.0.0",
      type: "free",
      features: ["responsive", "mobile-first"],
      compatibility: {
        apps: ["shopify-pay"],
        features: ["product-reviews"],
        limitations: ["custom-sections", "advanced-styling", "performance", "accessibility"],
      },
      requirements: {
        shopify_plan: "basic",
        liquid_version: "3.0",
        browser_support: ["chrome", "firefox", "safari"],
      },
    });

    this.themeDatabase.set("narrative", {
      name: "Narrative",
      version: "1.0.0",
      type: "free",
      features: ["responsive", "mobile-first", "accessibility"],
      compatibility: {
        apps: ["shopify-pay", "shopify-shipping"],
        features: ["product-reviews", "wishlist"],
        limitations: ["custom-sections", "advanced-styling"],
      },
      requirements: {
        shopify_plan: "basic",
        liquid_version: "4.0",
        browser_support: ["chrome", "firefox", "safari", "edge"],
      },
    });

    this.themeDatabase.set("minimal", {
      name: "Minimal",
      version: "1.0.0",
      type: "free",
      features: ["responsive", "mobile-first"],
      compatibility: {
        apps: ["shopify-pay"],
        features: ["product-reviews"],
        limitations: ["custom-sections", "advanced-styling", "performance", "accessibility"],
      },
      requirements: {
        shopify_plan: "basic",
        liquid_version: "3.0",
        browser_support: ["chrome", "firefox", "safari"],
      },
    });

    this.themeDatabase.set("supply", {
      name: "Supply",
      version: "1.0.0",
      type: "free",
      features: ["responsive", "mobile-first"],
      compatibility: {
        apps: ["shopify-pay"],
        features: ["product-reviews"],
        limitations: ["custom-sections", "advanced-styling", "performance", "accessibility"],
      },
      requirements: {
        shopify_plan: "basic",
        liquid_version: "3.0",
        browser_support: ["chrome", "firefox", "safari"],
      },
    });

    this.themeDatabase.set("venture", {
      name: "Venture",
      version: "1.0.0",
      type: "free",
      features: ["responsive", "mobile-first"],
      compatibility: {
        apps: ["shopify-pay"],
        features: ["product-reviews"],
        limitations: ["custom-sections", "advanced-styling", "performance", "accessibility"],
      },
      requirements: {
        shopify_plan: "basic",
        liquid_version: "3.0",
        browser_support: ["chrome", "firefox", "safari"],
      },
    });

    this.themeDatabase.set("boundless", {
      name: "Boundless",
      version: "1.0.0",
      type: "free",
      features: ["responsive", "mobile-first"],
      compatibility: {
        apps: ["shopify-pay"],
        features: ["product-reviews"],
        limitations: ["custom-sections", "advanced-styling", "performance", "accessibility"],
      },
      requirements: {
        shopify_plan: "basic",
        liquid_version: "3.0",
        browser_support: ["chrome", "firefox", "safari"],
      },
    });

    this.themeDatabase.set("pop", {
      name: "Pop",
      version: "1.0.0",
      type: "free",
      features: ["responsive", "mobile-first"],
      compatibility: {
        apps: ["shopify-pay"],
        features: ["product-reviews"],
        limitations: ["custom-sections", "advanced-styling", "performance", "accessibility"],
      },
      requirements: {
        shopify_plan: "basic",
        liquid_version: "3.0",
        browser_support: ["chrome", "firefox", "safari"],
      },
    });

    this.themeDatabase.set("simple", {
      name: "Simple",
      version: "1.0.0",
      type: "free",
      features: ["responsive", "mobile-first"],
      compatibility: {
        apps: ["shopify-pay"],
        features: ["product-reviews"],
        limitations: ["custom-sections", "advanced-styling", "performance", "accessibility"],
      },
      requirements: {
        shopify_plan: "basic",
        liquid_version: "3.0",
        browser_support: ["chrome", "firefox", "safari"],
      },
    });

    // Popular Shopify apps and their compatibility requirements
    this.appDatabase.set("product-reviews", {
      name: "Product Reviews",
      type: "feature",
      compatibility: {
        themes: ["dawn", "brooklyn", "narrative", "minimal", "supply", "venture", "boundless", "pop", "simple"],
        requirements: {
          liquid_version: "3.0",
          shopify_plan: "basic",
          browser_support: ["chrome", "firefox", "safari", "edge"],
        },
        limitations: ["custom-sections", "advanced-styling"],
      },
      installation: {
        difficulty: "easy",
        time_required: "5-10 minutes",
        technical_skills: "beginner",
      },
    });

    this.appDatabase.set("wishlist", {
      name: "Wishlist",
      type: "feature",
      compatibility: {
        themes: ["dawn", "brooklyn", "narrative"],
        requirements: {
          liquid_version: "4.0",
          shopify_plan: "basic",
          browser_support: ["chrome", "firefox", "safari", "edge"],
        },
        limitations: ["custom-sections"],
      },
      installation: {
        difficulty: "medium",
        time_required: "15-30 minutes",
        technical_skills: "intermediate",
      },
    });

    this.appDatabase.set("quick-buy", {
      name: "Quick Buy",
      type: "feature",
      compatibility: {
        themes: ["dawn"],
        requirements: {
          liquid_version: "5.0",
          shopify_plan: "basic",
          browser_support: ["chrome", "firefox", "safari", "edge"],
        },
        limitations: [],
      },
      installation: {
        difficulty: "hard",
        time_required: "30-60 minutes",
        technical_skills: "advanced",
      },
    });

    this.appDatabase.set("cart-drawer", {
      name: "Cart Drawer",
      type: "feature",
      compatibility: {
        themes: ["dawn"],
        requirements: {
          liquid_version: "5.0",
          shopify_plan: "basic",
          browser_support: ["chrome", "firefox", "safari", "edge"],
        },
        limitations: [],
      },
      installation: {
        difficulty: "hard",
        time_required: "30-60 minutes",
        technical_skills: "advanced",
      },
    });

    this.appDatabase.set("shopify-pay", {
      name: "Shopify Pay",
      type: "payment",
      compatibility: {
        themes: ["dawn", "brooklyn", "narrative", "minimal", "supply", "venture", "boundless", "pop", "simple"],
        requirements: {
          liquid_version: "3.0",
          shopify_plan: "basic",
          browser_support: ["chrome", "firefox", "safari", "edge"],
        },
        limitations: [],
      },
      installation: {
        difficulty: "easy",
        time_required: "5-10 minutes",
        technical_skills: "beginner",
      },
    });

    this.appDatabase.set("shopify-shipping", {
      name: "Shopify Shipping",
      type: "shipping",
      compatibility: {
        themes: ["dawn", "brooklyn", "narrative"],
        requirements: {
          liquid_version: "4.0",
          shopify_plan: "basic",
          browser_support: ["chrome", "firefox", "safari", "edge"],
        },
        limitations: [],
      },
      installation: {
        difficulty: "easy",
        time_required: "5-10 minutes",
        technical_skills: "beginner",
      },
    });

    this.appDatabase.set("shopify-analytics", {
      name: "Shopify Analytics",
      type: "analytics",
      compatibility: {
        themes: ["dawn"],
        requirements: {
          liquid_version: "5.0",
          shopify_plan: "basic",
          browser_support: ["chrome", "firefox", "safari", "edge"],
        },
        limitations: [],
      },
      installation: {
        difficulty: "easy",
        time_required: "5-10 minutes",
        technical_skills: "beginner",
      },
    });
  }

  /**
   * Extract theme and app information from query
   * @param {string} query - User query
   * @returns {Object} Extracted information
   */
  extractThemeAppInfo(query) {
    const queryLower = query.toLowerCase();

    // Extract theme names
    const themes = [];
    for (const [themeId, themeData] of this.themeDatabase) {
      if (queryLower.includes(themeId) || queryLower.includes(themeData.name.toLowerCase())) {
        themes.push(themeId);
      }
    }

    // Extract app names
    const apps = [];
    for (const [appId, appData] of this.appDatabase) {
      if (queryLower.includes(appId) || queryLower.includes(appData.name.toLowerCase())) {
        apps.push(appId);
      }
    }

    // Extract compatibility keywords
    const compatibilityKeywords = [
      "compatible", "compatibility", "works with", "supports", "supports",
      "compatible with", "works on", "runs on", "functions on", "operates on",
      "integrates with", "integrates", "integration", "integrate",
      "install", "installation", "installing", "installed",
      "setup", "set up", "setting up", "configure", "configuration",
      "customize", "customization", "customizing", "customized",
      "modify", "modification", "modifying", "modified",
      "adapt", "adaptation", "adapting", "adapted",
      "adjust", "adjustment", "adjusting", "adjusted",
      "tune", "tuning", "tuned", "optimize", "optimization",
      "optimizing", "optimized", "improve", "improvement",
      "improving", "improved", "enhance", "enhancement",
      "enhancing", "enhanced", "upgrade", "upgrading",
      "upgraded", "update", "updating", "updated",
      "refresh", "refreshing", "refreshed", "renew",
      "renewing", "renewed", "restore", "restoring",
      "restored", "reset", "resetting", "resetted",
      "rebuild", "rebuilding", "rebuilt", "reconstruct",
      "reconstructing", "reconstructed", "reassemble",
      "reassembling", "reassembled", "reinstall",
      "reinstalling", "reinstalled", "reconfigure",
      "reconfiguring", "reconfigured", "recustomize",
      "recustomizing", "recustomized", "repersonalize",
      "repersonalizing", "repersonalized", "retailor",
      "retailoring", "retailored", "readapt",
      "readapting", "readapted", "remodify",
      "remodifying", "remodified", "readjust",
      "readjusting", "readjusted", "retune",
      "retuning", "retuned", "reoptimize",
      "reoptimizing", "reoptimized", "reimprove",
      "reimproving", "reimproved", "reenhance",
      "reenhancing", "reenhanced", "reupgrade",
      "reupgrading", "reupgraded", "reupdate",
      "reupdating", "reupdated", "refreshing",
      "renewing", "restoring", "resetting",
    ];

    const hasCompatibilityKeywords = compatibilityKeywords.some(keyword =>
      queryLower.includes(keyword)
    );

    return {
      themes,
      apps,
      hasCompatibilityKeywords,
      isCompatibilityQuery: themes.length > 0 || apps.length > 0 || hasCompatibilityKeywords,
    };
  }

  /**
   * Check compatibility between theme and app
   * @param {string} themeId - Theme identifier
   * @param {string} appId - App identifier
   * @returns {Object} Compatibility result
   */
  checkCompatibility(themeId, appId) {
    const theme = this.themeDatabase.get(themeId);
    const app = this.appDatabase.get(appId);

    if (!theme) {
      return {
        compatible: false,
        error: `Theme ${themeId} not found in database`,
      };
    }

    if (!app) {
      return {
        compatible: false,
        error: `App ${appId} not found in database`,
      };
    }

    // Check if theme supports the app
    const themeSupportsApp = theme.compatibility.apps.includes(appId);
    const appSupportsTheme = app.compatibility.themes.includes(themeId);

    // Check requirements compatibility
    const themeRequirements = theme.requirements;
    const appRequirements = app.compatibility.requirements;

    const requirementsCompatible = (
      themeRequirements.liquid_version >= appRequirements.liquid_version &&
      themeRequirements.shopify_plan >= appRequirements.shopify_plan &&
      appRequirements.browser_support.every(browser =>
        themeRequirements.browser_support.includes(browser)
      )
    );

    const compatible = themeSupportsApp && appSupportsTheme && requirementsCompatible;

    return {
      compatible,
      theme,
      app,
      themeSupportsApp,
      appSupportsTheme,
      requirementsCompatible,
      installation: app.installation,
      limitations: theme.compatibility.limitations,
    };
  }

  /**
   * Determine if theme compatibility checker should be used
   * @param {string} query - User query
   * @returns {boolean} Whether to use theme compatibility checker
   */
  shouldUseThemeCompatibilityChecker(query) {
    const themeAppInfo = this.extractThemeAppInfo(query);
    return themeAppInfo.isCompatibilityQuery;
  }

  /**
   * Main method to handle theme compatibility requests
   * @param {string} query - User query
   * @returns {Object} Compatibility results
   */
  async checkCompatibility(query) {
    if (!query || typeof query !== "string") {
      return {
        error: "Invalid query provided",
        compatibility: [],
        summary: null,
      };
    }

    if (!this.shouldUseThemeCompatibilityChecker(query)) {
      return {
        error: "No theme compatibility check needed for this query",
        compatibility: [],
        summary: null,
      };
    }

    try {
      console.log(`🎨 Checking theme compatibility for: ${query}`);

      const themeAppInfo = this.extractThemeAppInfo(query);
      const compatibility = [];

      // Check compatibility between all theme-app pairs
      for (const themeId of themeAppInfo.themes) {
        for (const appId of themeAppInfo.apps) {
          const result = this.checkCompatibility(themeId, appId);
          compatibility.push({
            theme: themeId,
            app: appId,
            ...result,
          });
        }
      }

      // If only themes mentioned, show theme information
      if (themeAppInfo.themes.length > 0 && themeAppInfo.apps.length === 0) {
        for (const themeId of themeAppInfo.themes) {
          const theme = this.themeDatabase.get(themeId);
          if (theme) {
            compatibility.push({
              theme: themeId,
              app: null,
              compatible: true,
              theme,
              app: null,
              themeSupportsApp: true,
              appSupportsTheme: true,
              requirementsCompatible: true,
              installation: null,
              limitations: theme.compatibility.limitations,
            });
          }
        }
      }

      // If only apps mentioned, show app information
      if (themeAppInfo.apps.length > 0 && themeAppInfo.themes.length === 0) {
        for (const appId of themeAppInfo.apps) {
          const app = this.appDatabase.get(appId);
          if (app) {
            compatibility.push({
              theme: null,
              app: appId,
              compatible: true,
              theme: null,
              app,
              themeSupportsApp: true,
              appSupportsTheme: true,
              requirementsCompatible: true,
              installation: app.installation,
              limitations: [],
            });
          }
        }
      }

      // Generate summary
      const summary = this.generateSummary(compatibility, query);

      return {
        compatibility,
        summary,
        themeAppInfo,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Theme compatibility check error:", error);
      return {
        error: `Theme compatibility check failed: ${error.message}`,
        compatibility: [],
        summary: null,
      };
    }
  }

  /**
   * Generate a summary of compatibility results
   * @param {Array} compatibility - Array of compatibility results
   * @param {string} query - Original query
   * @returns {string} Summary text
   */
  generateSummary(compatibility, query) {
    if (compatibility.length === 0) {
      return "No theme compatibility information could be determined.";
    }

    let summary = `## 🎨 **Theme Compatibility Results**\n\n`;

    compatibility.forEach((result, index) => {
      if (result.theme && result.app) {
        summary += `${index + 1}. **${result.theme}** + **${result.app}**: `;
        summary += result.compatible ? "✅ **Compatible**" : "❌ **Not Compatible**";
        summary += "\n";

        if (result.compatible) {
          summary += `   - Installation: ${result.installation.difficulty} (${result.installation.time_required})\n`;
          summary += `   - Technical Skills: ${result.installation.technical_skills}\n`;
        } else {
          if (!result.themeSupportsApp) {
            summary += `   - Theme doesn't support this app\n`;
          }
          if (!result.appSupportsTheme) {
            summary += `   - App doesn't support this theme\n`;
          }
          if (!result.requirementsCompatible) {
            summary += `   - Requirements not met\n`;
          }
        }

        if (result.limitations && result.limitations.length > 0) {
          summary += `   - Limitations: ${result.limitations.join(", ")}\n`;
        }
      } else if (result.theme && !result.app) {
        summary += `${index + 1}. **${result.theme} Theme Information**:\n`;
        summary += `   - Version: ${result.theme.version}\n`;
        summary += `   - Type: ${result.theme.type}\n`;
        summary += `   - Features: ${result.theme.features.join(", ")}\n`;
        summary += `   - Supported Apps: ${result.theme.compatibility.apps.join(", ")}\n`;
        summary += `   - Supported Features: ${result.theme.compatibility.features.join(", ")}\n`;
        summary += `   - Limitations: ${result.theme.compatibility.limitations.join(", ")}\n`;
      } else if (!result.theme && result.app) {
        summary += `${index + 1}. **${result.app} App Information**:\n`;
        summary += `   - Type: ${result.app.type}\n`;
        summary += `   - Supported Themes: ${result.app.compatibility.themes.join(", ")}\n`;
        summary += `   - Installation: ${result.app.installation.difficulty} (${result.app.installation.time_required})\n`;
        summary += `   - Technical Skills: ${result.app.installation.technical_skills}\n`;
      }
      summary += "\n";
    });

    summary += `💡 **Shopify Context:** Theme compatibility is crucial for ensuring apps and features work properly with your store's design and functionality.`;

    return summary;
  }

  /**
   * Get tool information
   * @returns {Object} Tool metadata
   */
  getToolInfo() {
    return {
      name: this.name,
      description: this.description,
      capabilities: [
        "Theme-app compatibility checking",
        "Requirements validation",
        "Installation difficulty assessment",
        "Limitation identification",
        "Theme and app information lookup",
      ],
      examples: [
        "Is Product Reviews compatible with Dawn theme?",
        "What themes support Wishlist feature?",
        "Check compatibility between Brooklyn and Quick Buy",
        "What apps work with Narrative theme?",
        "Theme compatibility for Shopify Pay",
      ],
      supportedThemes: Array.from(this.themeDatabase.keys()),
      supportedApps: Array.from(this.appDatabase.keys()),
    };
  }
}

export default ThemeCompatibilityTool;
