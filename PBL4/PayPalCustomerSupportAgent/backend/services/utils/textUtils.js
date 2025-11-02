/**
 * Text utility functions
 */

/**
 * Check if source is policy-like (legal documents, terms, etc.)
 */
function isPolicyLikeSource(sourceName) {
  const lower = String(sourceName || "").toLowerCase();
  return (
    lower.includes("user_agreement") ||
    lower.includes("legal") ||
    lower.includes("seller_protection") ||
    lower.includes("buyer_protection") ||
    lower.includes("fees")
  );
}

/**
 * Check if text contains profanity
 */
function containsProfanity(text) {
  if (!text) return false;
  const blacklist = [
    "dumb",
    "stupid",
    "idiot",
    "shut up",
    "suck",
    "wtf",
    "hell",
    "crap",
    "damn",
  ];
  const lower = String(text).toLowerCase();
  return blacklist.some((w) => {
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (w.includes(" ")) {
      return lower.includes(w);
    }
    const re = new RegExp(`\\b${escaped}\\b`, "i");
    return re.test(lower);
  });
}

module.exports = {
  isPolicyLikeSource,
  containsProfanity,
};
