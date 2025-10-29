/**
 * Format structured response with issue type and disclaimer
 */
function formatStructuredResponse(
  issueType,
  includeDisclaimer,
  rawAnswer,
  disclaimer
) {
  // For greetings and identity questions, don't show "Issue:" prefix
  if (issueType === "greeting" || issueType === "identity") {
    return rawAnswer;
  }

  // For other issue types, show the structured format
  return [
    `Issue: ${issueType.replace(/_/g, " ")}`,
    rawAnswer,
    includeDisclaimer && disclaimer && `Disclaimer: ${disclaimer}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

module.exports = { formatStructuredResponse };
