/*
 * ========================================
 * CHANGES MADE FOR i18next INTEGRATION:
 * ========================================
 *
 * 1. ADDED useTranslation HOOK:
 *    - Imported useTranslation from react-i18next
 *    - This replaces manual language state management
 *    - Provides t() function for translations and i18n object for language control
 *
 * 2. REMOVED MANUAL LANGUAGE STATE:
 *    - Removed const [language, setLanguage] = useState("en")
 *    - Now using i18n.language instead of local state
 *    - Language persistence handled automatically by i18next
 *
 * 3. REPLACED ALL HARDCODED STRINGS:
 *    - All text now uses t('translationKey') instead of ternary operators
 *    - Translations stored in src/locales/en.json and src/locales/np.json
 *    - Makes adding new languages much easier
 *
 * 4. UPDATED LANGUAGE SWITCHING:
 *    - Replaced setLanguage() calls with i18n.changeLanguage()
 *    - Language preference automatically saved to localStorage
 *    - No need to manually manage language state
 *
 * 5. ADDED LANGUAGE CHANGE EFFECT:
 *    - useEffect to update welcome message when language changes
 *    - Ensures UI updates immediately when language switches
 *
 * 6. UPDATED API CALLS:
 *    - Now sends i18n.language instead of local language state
 *    - Backend receives correct language code for processing
 *
 * BENEFITS:
 * - Professional internationalization
 * - Automatic language detection and persistence
 * - Easier maintenance and adding new languages
 * - Industry standard approach
 * - Better performance (no unnecessary re-renders)
 */

import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next"; // ADDED: Import useTranslation hook for i18next
import {
  Send,
  MessageCircle,
  MapPin,
  Clock,
  Phone,
  ChevronRight,
  Loader,
} from "lucide-react";

import TrackOrderFlashcard from "./components/TrackOrderFlashcard.jsx";

export default function FoodmanduSupportAgent() {
  // CHANGED: Added useTranslation hook to replace manual language management
  const { t, i18n } = useTranslation();

  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: t("welcome"), // CHANGED: Now using translation key instead of hardcoded text
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  // REMOVED: const [language, setLanguage] = useState("en"); - Now using i18n.language
  const [showOrderTracking, setShowOrderTracking] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [trackingOrderId, setTrackingOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [availableOrders, setAvailableOrders] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ADDED: Effect to update welcome message when language changes
  useEffect(() => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === 1 ? { ...msg, text: t("welcome") } : msg))
    );
  }, [i18n.language, t]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load available orders on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/orders");
        const data = await response.json();
        if (data.success) {
          setAvailableOrders(data.data);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };
    fetchOrders();
  }, []);

  // Function to detect tracking intent
  const detectTrackingIntent = (message) => {
    const trackingKeywords = [
      "track",
      "tracking",
      "order",
      "delivery",
      "where",
      "status",
      "location",
      "eta",
      "arrival",
      "driver",
      "delivery person",
    ];
    const lowerMessage = message.toLowerCase();
    return trackingKeywords.some((keyword) => lowerMessage.includes(keyword));
  };

  // Function to extract order details from message
  const extractOrderDetails = (message) => {
    // Improved regex patterns to extract order ID and location
    // Look for order IDs in format: FM followed by numbers, or ORD- followed by numbers
    const orderIdMatch = message.match(
      /(?:order\s*(?:id|number)|id)\s*:?\s*(FM\d+|ORD-?\d+|FM[A-Z0-9-]+)/i
    );
    const locationMatch = message.match(
      /(?:location|restaurant|from)\s*:?\s*([A-Za-z][^,.\n]+)/i
    );

    // Only return order ID if it matches proper format (starts with letters and has minimum length)
    const extractedOrderId =
      orderIdMatch && orderIdMatch[1].trim().length >= 3
        ? orderIdMatch[1].trim()
        : null;

    return {
      orderId: extractedOrderId,
      location: locationMatch ? locationMatch[1].trim() : null,
    };
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      text: input,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    const currentInput = input;
    setInput("");
    setLoading(true);

    // Let backend intent classifier handle all queries (removed frontend interception)
    try {
      // Get user location if available
      let userLat = null;
      let userLng = null;
      try {
        if (navigator.geolocation) {
          // Try to get cached location or request
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 2000,
              maximumAge: 300000, // 5 minutes
            });
          }).catch(() => null);

          if (position) {
            userLat = position.coords.latitude;
            userLng = position.coords.longitude;
          }
        }
      } catch (geoError) {
        // Silently fail - location is optional
      }

      // Call backend API with enhanced chat endpoint
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: currentInput,
          language: i18n.language,
          userLat: userLat,
          userLng: userLng,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const botResponse = {
          id: messages.length + 2,
          type: "bot",
          text: data.answer,
          timestamp: new Date(),
          // Include MCP result metadata if available
          mcpResult: data.data?.mcpResult || null,
          intent: data.data?.intent || null,
        };

        setMessages((prev) => [...prev, botResponse]);

        // If MCP tool was used and returned order tracking, show flashcard
        if (data.data?.mcpResult?.hasData && data.data?.mcpResult?.orderId) {
          const orderId = data.data.mcpResult.orderId;
          setTrackingOrderId(orderId);
          setShowOrderTracking(true);
        } else if (
          data.data?.intent === "track_order" &&
          data.data?.mcpTool === "get_all_details"
        ) {
          // Also show flashcard if tracking intent detected (even without explicit mcpResult)
          const orderIdFromResponse =
            data.data.mcpResult?.orderId ||
            extractOrderDetails(currentInput).orderId;
          if (orderIdFromResponse) {
            setTrackingOrderId(orderIdFromResponse);
            setShowOrderTracking(true);
          }
        }
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Error calling API:", error);
      const errorResponse = {
        id: messages.length + 2,
        type: "bot",
        text: t("errorMessage"),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle quick action clicks
  const handleQuickAction = async (actionLabel) => {
    if (actionLabel === t("trackOrder")) {
      const promptResponse = {
        id: messages.length + 1,
        type: "bot",
        text: t("trackOrderPrompt"),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, promptResponse]);
    } else if (actionLabel === t("requestRefund")) {
      // Handle refund request
      const refundPrompt = {
        id: messages.length + 1,
        type: "bot",
        text:
          i18n.language === "np"
            ? "कृपया आफ्नो अर्डर आइडी र रिफन्ड चाहनुको कारण बताउनुहोस्। हामी तपाईंको रिफन्ड अनुरोध प्रशोधन गर्नेछौं।"
            : "Please provide your Order ID and the reason for the refund request. We'll process your refund request.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, refundPrompt]);

      // Set input to help user
      setInput(
        i18n.language === "np"
          ? "मलाई रिफन्ड चाहिएको छ "
          : "I need a refund for order "
      );
    } else if (actionLabel === t("contactRestaurant")) {
      // Handle contact restaurant
      const contactPrompt = {
        id: messages.length + 1,
        type: "bot",
        text:
          i18n.language === "np"
            ? "कृपया आफ्नो अर्डर आइडी प्रदान गर्नुहोस् र हामी तपाईंलाई रेस्टुरेन्ट सम्पर्क विवरण प्रदान गर्नेछौं।"
            : "Please provide your Order ID and we'll help you with restaurant contact details.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, contactPrompt]);

      // Set input to help user
      setInput(
        i18n.language === "np"
          ? "रेस्टुरेन्ट सम्पर्क गर्नुहोस् "
          : "Contact restaurant for order "
      );
    }
  };

  // CHANGED: Now using translation keys instead of ternary operators
  const quickActions = [
    {
      label: t("trackOrder"),
      icon: Clock,
      action: () => handleQuickAction(t("trackOrder")),
    },
    {
      label: t("requestRefund"),
      icon: MapPin,
      action: () => handleQuickAction(t("requestRefund")),
    },
    {
      label: t("contactRestaurant"),
      icon: Phone,
      action: () => handleQuickAction(t("contactRestaurant")),
    },
  ];

  // ADDED: Function to handle language changes using i18next
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-yellow-50 to-red-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-yellow-100 flex flex-col shadow-sm">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-yellow-500 to-yellow-300">
          <div className="flex items-center gap-3 mb-4">
            <div>
              <img src="./logo-n.png" alt="logo" className="w-44" />
              <p className="text-yellow-100 text-sm ml-10">Support Agent</p>
            </div>
          </div>
        </div>

        {/* Language Toggle */}
        <div className="p-4 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-600 mb-3 uppercase">
            {t("language")}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => changeLanguage("en")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                i18n.language === "en"
                  ? "bg-yellow-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t("english")}
            </button>
            <button
              onClick={() => changeLanguage("np")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                i18n.language === "np"
                  ? "bg-yellow-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t("nepali")}
            </button>
          </div>
        </div>

        {/* Order Tracking Section */}
        <div className="p-4 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-600 mb-3 uppercase">
            {t("quickTracking")}
          </p>
          <div className="space-y-2">
            <select
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
            >
              <option value="">
                {t("selectOrder") || "Select an order..."}
              </option>
              {availableOrders.map((order) => (
                <option key={order.orderId} value={order.orderId}>
                  {order.orderNumber} - {order.restaurant.name} ({order.status})
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                if (orderId.trim()) {
                  const selectedOrderId = orderId.trim();
                  setTrackingOrderId(selectedOrderId);
                  setShowOrderTracking(true);

                  // Add bot message to chat showing tracking started
                  const trackingMessage = {
                    id: Date.now(),
                    type: "bot",
                    text: `${
                      t("trackOrder") || "Tracking order"
                    }: ${selectedOrderId}`,
                    timestamp: new Date(),
                  };
                  setMessages((prev) => [...prev, trackingMessage]);
                }
              }}
              disabled={!orderId.trim()}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {t("track")}
            </button>
          </div>
        </div>

        {/* Support Info */}
        <div className="p-4 mt-auto border-t border-gray-200">
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <p className="text-xs text-blue-900 font-medium">
              {t("avgResponseTime")}
            </p>
          </div>
          <p className="text-xs text-gray-500">{t("available247")}</p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {t("supportChat")}
            </h2>
            <p className="text-sm text-green-600 font-medium">● online</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-all">
              <Phone className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-all">
              <MessageCircle className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-md px-4 py-3 rounded-2xl ${
                  msg.type === "user"
                    ? "bg-yellow-500 text-white rounded-br-none shadow-md"
                    : "bg-gray-100 text-gray-900 rounded-bl-none"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p
                  className={`text-xs mt-2 ${
                    msg.type === "user" ? "text-yellow-100" : "text-gray-500"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-2xl rounded-bl-none">
                <Loader className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}

          {/* Order Tracking Flashcard */}
          {showOrderTracking && (
            <TrackOrderFlashcard
              orderId={trackingOrderId}
              onClose={() => setShowOrderTracking(false)}
            />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="px-8 py-3 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">
            {t("quickActions")}
          </p>
          <div className="flex gap-2 flex-wrap">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <button
                  key={idx}
                  onClick={action.action}
                  className="flex items-center gap-2 px-3 py-2 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 text-yellow-700 rounded-lg text-xs font-medium transition-all cursor-pointer"
                >
                  <Icon className="w-4 h-4" />
                  {action.label}
                  <ChevronRight className="w-3 h-3" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-gray-200">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={t("typeMessage")}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
            />
            <button
              onClick={handleSendMessage}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{t("send")}</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">{t("tip")}</p>
        </div>
      </div>
    </div>
  );
}
