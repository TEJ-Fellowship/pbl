/**
 * Clear Storage Utility
 * Run this in browser console to clear all chat data
 */

// Clear all Stripe chat data from localStorage
function clearStripeData() {
  console.log("🗑️ Clearing Stripe chat data from localStorage...");

  // Clear specific keys
  localStorage.removeItem("stripe_chat_history");
  localStorage.removeItem("stripe_current_session");

  console.log("✅ Stripe chat data cleared from localStorage");
  console.log("🔄 Please refresh the page to see changes");
}

// Clear all localStorage (more aggressive)
function clearAllLocalStorage() {
  console.log("🗑️ Clearing ALL localStorage data...");
  localStorage.clear();
  console.log("✅ All localStorage data cleared");
  console.log("🔄 Please refresh the page to see changes");
}

// Show current localStorage data
function showLocalStorage() {
  console.log("📊 Current localStorage data:");
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(`${key}:`, value);
  }
}

// Export functions to global scope
window.clearStripeData = clearStripeData;
window.clearAllLocalStorage = clearAllLocalStorage;
window.showLocalStorage = showLocalStorage;

console.log("🛠️ Storage utilities loaded:");
console.log("- clearStripeData() - Clear only Stripe chat data");
console.log("- clearAllLocalStorage() - Clear all localStorage");
console.log("- showLocalStorage() - Show current localStorage data");
