# 🌸 Cultural Context Implementation

## Overview

Successfully implemented **cultural context awareness** for the Foodmandu Support Agent, addressing one of the unique challenges: **festival rush times and food preferences** in Nepal.

---

## 🎯 Implementation Summary

### **3 New MCP Tools Added:**

#### 1. **`checkFestivalSchedule`** 
- **Purpose:** Detect Nepali festivals and expected order volume impacts
- **Key Features:**
  - 2025 festival calendar (Dashain, Tihar, Holi, Indra Jatra, Buddha Jayanti, etc.)
  - Extended periods for multi-day festivals (Dashain 15 days, Tihar 5 days)
  - Order volume multipliers (1.2x to 4.0x based on impact)
  - Bilingual responses (English & Nepali)
  
**Example Usage:**
```
"What festival is today?"
"Is it Dashain time?"
"Festival today?"
```
**Response:** Detects festival, volume impact, and provides recommendations.

---

#### 2. **`suggestFestivalFood`**
- **Purpose:** Recommend traditional foods for festivals or regions
- **Key Features:**
  - Festival-specific foods (Dashain: meat dishes, Tihar: sweets, Holi: snacks)
  - Regional preferences (Kathmandu, Pokhara, Terai, Hills)
  - Bilingual food names (English + Nepali)
  - Restaurant type suggestions
  
**Example Usage:**
```
"What food for Dashain?"
"Festival food for Tihar"
"Traditional food for Holi"
"What food in Pokhara?"
```

---

#### 3. **`getRegionalPreferences`**
- **Purpose:** Provide location-based food preferences and cultural insights
- **Key Features:**
  - 6+ regions covered (Kathmandu, Thamel, Pokhara, Patan, Boudha, Chitwan)
  - Mealtime-specific recommendations (breakfast, lunch, dinner, snack)
  - Cultural insights and traditions
  - Spice preferences, payment methods, delivery times
  
**Example Usage:**
```
"Food preferences in Thamel"
"What food in Kathmandu"
"Regional food in Pokhara"
"Nepali cuisine in Patan"
```

---

## 🔧 Technical Integration

### **Files Created/Modified:**

#### **New Files:**
1. `backend/src/mcp/tools/checkFestivalSchedule.js` - Festival detection
2. `backend/src/mcp/tools/suggestFestivalFood.js` - Food recommendations
3. `backend/src/mcp/tools/getRegionalPreferences.js` - Regional insights

#### **Modified Files:**
1. `backend/src/mcp/tools/index.js` - Exported new tools
2. `backend/src/mcp/server.js` - Added tool handlers & metadata
3. `backend/src/utils/intentClassifier.js` - Added 3 new intent patterns:
   - `festival_check` → calls `check_festival_schedule`
   - `festival_food_suggestion` → calls `suggest_festival_food`
   - `regional_preferences` → calls `get_regional_preferences`
4. `backend/src/controllers/qacontrollers.js` - Added response formatters for bilingual output
5. `docs/requirements.md` - Marked cultural context as complete ✅

---

## 🎨 Features

### **Festival Awareness:**
- ✅ Automatically detects 12+ major Nepali festivals
- ✅ Calculates expected order volume (1.2x to 4.0x normal)
- ✅ Handles extended festival periods (Dashain 15 days, Tihar 5 days)
- ✅ Provides delivery management recommendations
- ✅ Bilingual festival names and descriptions

### **Food Recommendations:**
- ✅ Festival-specific traditional foods
- ✅ Regional food preferences (Kathmandu vs Pokhara vs Terai)
- ✅ Mealtime-specific suggestions
- ✅ Cultural context and traditions
- ✅ Restaurant type recommendations
- ✅ Bilingual food names (English + Nepali)

### **Regional Insights:**
- ✅ 6+ major regions with detailed profiles
- ✅ Urban vs tourist vs historical vs religious area types
- ✅ Spice preferences and cuisine types
- ✅ Payment methods and delivery time expectations
- ✅ Cultural traditions and popular areas

---

## 📊 Data Coverage

### **Festivals (12+):**
- Dashain (extreme impact - 4x)
- Tihar (very high - 3x)
- Indra Jatra (very high - 3x)
- Holi (high - 2x)
- Buddha Jayanti (high - 2x)
- Janai Purnima, Yomari Punhi, Shivaratri, Lhosar festivals
- And more...

### **Regions (6+):**
- Kathmandu (urban)
- Thamel (tourist)
- Pokhara (urban)
- Patan (historical)
- Boudha (religious)
- Chitwan (terai)
- Generic Nepal-wide fallback

### **Food Types (100+ items):**
- Festival-specific: 50+ traditional dishes
- Regional-specific: 60+ popular foods
- Mealtime-specific: Breakfast, lunch, dinner, snack recommendations

---

## 🚀 Usage Examples

### **Festival Detection:**
```
User: "What festival is today?"
Bot: "Dashain is today! Expected orders: 4x normal. 
      Festival period ongoing - expect massive delays. 
      Advise customers to order earlier."
```

### **Festival Food:**
```
User: "What food for Tihar?"
Bot: "Traditional Tihar festival food: Sel Roti, Lakhamari, 
      Anarsa, Barfi, Peda. Festival of Lights is all about sweets! 
      Families share and gift sweets."
```

### **Regional Preferences:**
```
User: "Food preferences in Thamel"
Bot: "Popular foods: Pizza, Burger, Momo, Pasta, Western breakfast. 
      Best for: International food, variety, quality. 
      Expect higher prices and tourist crowds."
```

---

## ✨ Benefits

### **For Users:**
- 🎉 Get culturally relevant food recommendations
- 📅 Know festival dates and expected delays
- 🗺️ Discover regional food preferences
- 🍜 Learn traditional Nepali cuisine

### **For Operations:**
- 📊 Forecast order volumes during festivals
- 🚨 Prepare for peak demands (Dashain, Tihar)
- 🍽️ Optimize restaurant menus by region
- 📍 Understand regional delivery preferences
- 🌍 Provide localized, culturally-aware support

---

## 🧪 Testing

### **Test Commands:**

**Festival Detection:**
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What festival is today?", "language": "en"}'
```

**Festival Food:**
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What food for Dashain?", "language": "np"}'
```

**Regional Preferences:**
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Food preferences in Pokhara", "language": "en"}'
```

---

## 📈 Impact

### **Requirements Coverage:**
- ✅ **Tier 3:** Festival/event mode for high-order volumes
- ✅ **Tier 4:** Cultural context (partially) via MCP tools
- ✅ **Unique Challenge:** Festival rush times & food preferences - **COMPLETE**

### **Total MCP Tools:** 13
- 7 Order tracking tools
- 3 Support tools (weather, payment, address)
- **3 Cultural context tools** ⭐ **NEW**

---

## 🎓 Cultural Insights Included

### **Festival Context:**
- Dashain = Meat-heavy feast (15 days)
- Tihar = Sweet celebration (5 days)
- Holi = Colorful snacking
- Indra Jatra = Newari street feast
- Buddha Jayanti = Vegetarian respect

### **Regional Culture:**
- Kathmandu = Momo + Chow Mein capital
- Thamel = International tourist hub
- Pokhara = Fresh fish + lakeside dining
- Patan = Authentic Newari cuisine
- Boudha = Tibetan Buddhist foods
- Terai = Rice-heavy, Indian-influenced

---

## 🔄 Future Enhancements

1. **Real-time Festival Database** - Auto-update festival dates annually
2. **Dynamic Food Availability** - Check actual restaurant menus during festivals
3. **User Location Auto-detect** - Suggest foods based on GPS location
4. **Festival Special Offers** - Integrate promotional campaigns
5. **Community Preferences** - Learn from user ordering patterns

---

## 🎉 Summary

Successfully integrated **3 comprehensive MCP tools** that bring **cultural context awareness** to the Foodmandu Support Agent:

✅ **Festival Detection** - Know when order volumes spike  
✅ **Food Recommendations** - Suggest culturally appropriate dishes  
✅ **Regional Insights** - Provide location-aware guidance  

**Result:** The agent now understands and adapts to Nepali cultural context, making it truly localized for Nepal's unique food delivery market! 🌸🍜

---

## 📝 Documentation Updated

- ✅ `docs/requirements.md` - Marked cultural context as complete
- ✅ Created `CULTURAL_CONTEXT_IMPLEMENTATION.md` (this file)
- ✅ `backend/src/mcp/tools/README.md` - Tool structure documented

---

**Implementation Date:** Completed ✅  
**Status:** Production Ready 🚀

