/**
 * Combine hybrid search results with web search results
 */
function combineHybridAndWebResults(hybridResults, webResults) {
  console.log(
    `Combining ${hybridResults.length} hybrid + ${webResults.length} web results`
  );

  // Balanced combination logic - prioritize hybrid results for accuracy
  const allResults = [];

  // Add hybrid results with minimal score reduction
  hybridResults.forEach((result) => {
    allResults.push({
      ...result,
      source: "hybrid",
      adjustedScore: result.combinedScore * 0.9, // Minimal reduction
      priority: "documentation",
      originalScore: result.combinedScore,
    });
  });

  // Add web results with moderate scoring
  webResults.forEach((result) => {
    // Handle both old and new result formats
    const combinedScore = result.combinedScore || result.score || 0.8;
    const metadata = result.metadata || {
      title: result.title,
      text: result.snippet,
      preview: result.snippet,
      source: result.link || result.url,
    };

    allResults.push({
      ...result,
      metadata,
      source: "web_search",
      combinedScore,
      adjustedScore: combinedScore * 1.1, // Moderate boost
      priority: "recent_info",
      isRecent: result.isRecent !== undefined ? result.isRecent : true,
      isOfficial:
        result.isOfficial !== undefined
          ? result.isOfficial
          : /paypal\.com/i.test(metadata.source || ""),
      originalScore: combinedScore,
    });
  });

  // Balanced sorting algorithm - prioritize quality over source
  allResults.sort((a, b) => {
    // Primary: adjusted score (quality first)
    if (Math.abs(a.adjustedScore - b.adjustedScore) > 0.1) {
      return b.adjustedScore - a.adjustedScore;
    }

    // Secondary: official sources first
    if (a.isOfficial !== b.isOfficial) {
      return b.isOfficial - a.isOfficial;
    }

    // Tertiary: recent content for recent queries
    if (a.isRecent !== b.isRecent) {
      return b.isRecent - a.isRecent;
    }

    // Quaternary: prefer hybrid for general queries, web for status queries
    const isStatusQuery = /(down|status|outage|maintenance|working)/i.test(
      hybridResults[0]?.metadata?.text || ""
    );
    if (isStatusQuery && a.source !== b.source) {
      return a.source === "web_search" ? -1 : 1;
    } else if (!isStatusQuery && a.source !== b.source) {
      return a.source === "hybrid" ? -1 : 1;
    }

    // Final: original combined score
    return b.originalScore - a.originalScore;
  });

  // Return top 3 results with balanced mix
  const topResults = allResults.slice(0, 3);

  console.log(
    `Final combined results: ${topResults.length} (${
      topResults.filter((r) => r.source === "web_search").length
    } web + ${topResults.filter((r) => r.source === "hybrid").length} hybrid)`
  );

  return topResults;
}

module.exports = { combineHybridAndWebResults };
