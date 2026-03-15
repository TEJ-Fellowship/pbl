# 🧘‍♂️ Soul Sync (Nirvana) — A Personal Mindfulness Tracker

> _"Sync your breath, mood, and mindfulness — intelligently."_

**Category:** Wellness / Self-care

---

## 🌿 Overview

Soul Sync is a personal mindfulness tracker designed to help users build calm and consistency in their meditation or breathing routines. It starts as a simple session logger and evolves into an intelligent mindfulness companion using the Google Gemini API.

**Users can:**

- ✅ Track meditation or breathing sessions
- ✅ Maintain daily streaks
- ✅ Get motivational quotes
- ✅ Receive personalized AI-powered prompts and reflections

---

## 🧩 Tier 1: Mindfulness Tracker (React Fundamentals)

### Features

- ⏱ Start a timer for meditation/breathing (e.g., 1 min, 5 min, 10 min)
- 📆 Log sessions after timer completion
- 🔥 View daily streaks (e.g., "3-day streak")
- 🗓 See session history (date & duration)
- ❌ Reset or skip sessions with confirmation
- 📱 Mobile-responsive UI using Tailwind CSS

### Tech Stack

- React basics: `useState`, `useContext`, props
- **Core components:** `SessionTimer`, `SessionLog`, `StreakCounter`, `HistoryList`

---

## 🌞 Tier 2: Daily Quote Integration (API Integration)

### APIs

- **ZenQuotes API** or **Type.fit Quotes API**

### Features

- 🧘 Show daily motivational/mindfulness quote
- 🔁 "New Quote" button to refresh the quote
- ⚠️ Handle loading, error, and success states
- 🧪 Fetch with axios or fetch
- ✨ Optional: Animate quote appearance (fade-in)

---

## 🤖 Tier 3: Gemini-Powered Mindfulness Companion (AI Features)

Using **Google Gemini API** to:

- 💬 Generate personalized prompts (e.g., "What made today feel stressful?")
- 🧘‍♀️ Accept user input and return calming summaries or encouragement
- 🧠 Suggest short routines based on mood or session patterns
- 📊 Provide weekly summaries (e.g., "You meditated 5 times this week — great job staying consistent!")
- 🎧 _(Optional)_ Recommend relaxing audio based on user mood

---

## ✨ Optional Enhancements

- 💾 Save sessions/streaks to localStorage or Firebase
- 🎶 Add background meditation sounds or animations
- 🌙 Add dark/light theme toggle
- 💬 Enable natural language input: "I feel anxious" → Suggest calming breathing session

---

## 🔌 Suitable APIs

| API | Purpose |
|-----|---------|
| **ZenQuotes API** | Daily inspiration |
| **Google Gemini API** | Personalized mindfulness companion |
