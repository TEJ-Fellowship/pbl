// Utility functions for chat management

const STORAGE_KEY = "paypal_chat_threads";

/**
 * Generate a unique session ID
 */
export const generateSessionId = () => {
  // Add more entropy to ensure uniqueness across threads
  return `chat_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}_${Math.random().toString(36).slice(2)}`;
};

/**
 * Get all chat threads from localStorage
 */
export const getChatThreads = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading chat threads:", error);
    return [];
  }
};

/**
 * Save chat threads to localStorage
 */
export const saveChatThreads = (threads) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  } catch (error) {
    console.error("Error saving chat threads:", error);
  }
};

/**
 * Create a new chat thread
 */
export const createChatThread = () => {
  const newThread = {
    sessionId: generateSessionId(),
    title: "New Chat",
    lastMessageAt: new Date().toISOString(),
    messageCount: 0,
  };

  const threads = getChatThreads();
  threads.unshift(newThread); // Add to beginning
  saveChatThreads(threads);

  return newThread;
};

/**
 * Update a chat thread
 */
export const updateChatThread = (sessionId, updates) => {
  const threads = getChatThreads();
  const updatedThreads = threads.map((thread) => {
    if (thread.sessionId === sessionId) {
      // Always update lastMessageAt when updating (unless explicitly provided)
      return {
        ...thread,
        ...updates,
        lastMessageAt: updates.lastMessageAt || new Date().toISOString(),
      };
    }
    return thread;
  });
  saveChatThreads(updatedThreads);
  return updatedThreads.find((t) => t.sessionId === sessionId);
};

/**
 * Delete a chat thread
 */
export const deleteChatThread = (sessionId) => {
  const threads = getChatThreads();
  const updatedThreads = threads.filter(
    (thread) => thread.sessionId !== sessionId
  );
  saveChatThreads(updatedThreads);
  return updatedThreads;
};

/**
 * Format date for display in sidebar
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
};

/**
 * Map source names to PayPal URLs
 */
export const getSourceUrl = (sourceName) => {
  if (!sourceName) return null;

  const sourceLower = sourceName.toLowerCase();

  const sourceUrlMap = {
    "paypal_consumer_fees.json":
      "https://www.paypal.com/us/webapps/mpp/paypal-fees",
    "paypal_merchant_fees.json":
      "https://www.paypal.com/us/webapps/mpp/paypal-fees",
    "paypal_braintree_fees.json":
      "https://www.paypal.com/us/webapps/mpp/paypal-fees",
    user_agreement:
      "https://www.paypal.com/us/webapps/mpp/ua/useragreement-full",
    "user agreement":
      "https://www.paypal.com/us/webapps/mpp/ua/useragreement-full",
    policy: "https://www.paypal.com/us/webapps/mpp/ua/useragreement-full",
    policies: "https://www.paypal.com/us/webapps/mpp/ua/useragreement-full",
    seller_protection:
      "https://www.paypal.com/us/webapps/mpp/security/seller-protection",
    "seller protection":
      "https://www.paypal.com/us/webapps/mpp/security/seller-protection",
    buyer_protection:
      "https://www.paypal.com/us/webapps/mpp/paypal-safety-and-security",
    "buyer protection":
      "https://www.paypal.com/us/webapps/mpp/paypal-safety-and-security",
    "purchase protection":
      "https://www.paypal.com/us/webapps/mpp/paypal-safety-and-security",
    dispute: "https://www.paypal.com/disputes/",
    disputes: "https://www.paypal.com/disputes/",
    "dispute resolution": "https://www.paypal.com/disputes/",
    developer_docs: "https://developer.paypal.com/docs/",
    developer: "https://developer.paypal.com/docs/",
    api: "https://developer.paypal.com/docs/",
    docs: "https://developer.paypal.com/docs/",
  };

  if (sourceUrlMap[sourceLower]) {
    return sourceUrlMap[sourceLower];
  }

  for (const [key, url] of Object.entries(sourceUrlMap)) {
    if (sourceLower.includes(key)) {
      return url;
    }
  }

  return "https://www.paypal.com/us/cshelp/";
};

/**
 * Format text with links and markdown
 */
export const formatText = (text) => {
  if (!text || typeof text !== "string") return "No content available";

  let formatted = text;

  // Handle 🔗 emoji links
  formatted = formatted.replace(
    /🔗\s*(https?:\/\/[^\s<>"{}|\\^`[\]()]+|[a-zA-Z0-9][^\s<>"{}|\\^`[\]()]*\.[a-zA-Z]{2,}[^\s<>"{}|\\^`[\]()]*)/gi,
    (match, url) => {
      let href = url.trim();
      if (!href.startsWith("http://") && !href.startsWith("https://")) {
        href = "https://" + href;
      }
      return `🔗 <a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors break-all">${url.trim()}</a>`;
    }
  );

  // Convert plain URLs to clickable links
  const urlRegex =
    /(https?:\/\/[^\s<>"{}|\\^`[\]()]+|www\.[^\s<>"{}|\\^`[\]()]+|[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(:\d+)?(\/[^\s<>"{}|\\^`[\]()]*)?)/gi;

  const matches = [];
  let match;
  urlRegex.lastIndex = 0;
  while ((match = urlRegex.exec(formatted)) !== null) {
    matches.push({
      url: match[0],
      index: match.index,
    });
  }

  for (let i = matches.length - 1; i >= 0; i--) {
    const { url, index } = matches[i];
    const before = formatted.substring(Math.max(0, index - 100), index);
    if (
      before.includes("<a ") ||
      before.includes("href=") ||
      before.includes("](")
    ) {
      continue;
    }

    let cleanUrl = url.replace(/[.,;:!?]+$/, "");
    const trailingPunct = url.slice(cleanUrl.length);
    let href = cleanUrl;
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      href = "https://" + cleanUrl;
    }

    const replacement = `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors break-all">${cleanUrl}</a>${trailingPunct}`;
    formatted =
      formatted.substring(0, index) +
      replacement +
      formatted.substring(index + url.length);
  }

  return formatted
    .replace(
      /\*\*(.*?)\*\*/g,
      "<strong class='text-white font-semibold'>$1</strong>"
    )
    .replace(/\*(.*?)\*/g, "<em class='text-gray-200'>$1</em>")
    .replace(
      /`(.*?)`/g,
      "<code class='bg-slate-900/80 px-2 py-0.5 rounded text-cyan-300 font-mono border border-cyan-500/30'>$1</code>"
    )
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>");
};

/**
 * Get sentiment emoji
 */
export const getSentimentEmoji = (sentiment) => {
  switch (sentiment?.toLowerCase()) {
    case "positive":
      return "😊";
    case "negative":
      return "😟";
    case "neutral":
      return "😐";
    default:
      return "💭";
  }
};

/**
 * Convert database history format to message format
 */
export const convertHistoryToMessages = (history) => {
  return history.map((msg, idx) => ({
    id: idx + 1,
    sender: msg.role === "user" ? "user" : "bot",
    text: msg.content,
    timestamp: new Date(msg.created_at),
    sentiment: msg.metadata?.sentiment?.sentiment,
    citations: msg.metadata?.citations,
    confidence: msg.metadata?.confidence,
    disclaimer: msg.metadata?.disclaimer,
  }));
};
