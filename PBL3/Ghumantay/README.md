# 🚶 Ghumantey Sathi — An Intelligent Travel Partner

> _"Don't just travel — travel smart with Ghumantey Sathi."_

**Category:** Travel / Productivity

---

## 🌍 Overview

Ghumantey Sathi is an intelligent travel planner that helps users create, organize, and optimize their travel itineraries. Users can manually add trip details, get suggestions for nearby places to visit, and receive AI-generated daily plans based on preferences and time constraints.

**Users can:**

- ✅ Add and manage trip plans
- ✅ Organize day-by-day travel activities
- ✅ Get smart suggestions for places and optimized routes

---

## 🧩 Tier 1: Basic Itinerary Builder (React Fundamentals)

### Features

- 🗺️ Add new trips with destination and dates
- 📅 Add day-wise plans with activities (e.g., "Visit LakeSide at 10 AM")
- ✅ Toggle activities as "completed" for progress tracking
- 🗂️ View organized daily plans per trip
- 📱 Mobile-responsive layout with Tailwind CSS

### Tech Stack

- React using `useState`, `useContext`, and props
- **Core components:** `TripForm`, `DayPlanner`, `ActivityToggle`, `TripOverview`

---

## 📍 Tier 2: Explore Places (API Integration)

### APIs

- **Google Places API** — Points of interest
- **Triposo API** — Travel recommendations and content

### Features

- 🔍 Fetch nearby places of interest (e.g., landmarks, restaurants, attractions)
- 🎯 Filter by type (e.g., Nature, Culture, Food)
- 🧭 Show place info: name, type, description, photos, and ratings
- 🗂️ Add suggested places directly into the daily itinerary
- ⚠️ Handle API loading, error, and success states

---

## 🤖 Tier 3: AI-Powered Itinerary Optimization (Gemini Integration)

Using **Google Gemini API** to:

- 🧠 Analyze user interests and travel time to generate personalized daily itineraries
- ✏️ Interpret free-text input (e.g., "I want a chill day with light sightseeing") into a full plan
- 📌 Suggest optimized routes and activity order to save time
- 📝 Reflect on past days and adjust upcoming plans (e.g., "Too many museums yesterday? Let's explore nature today.")
- 📊 Summarize trip highlights at the end

---

## ✨ Optional Enhancements

- 💾 Store trips and plans in localStorage or Firebase
- 🗺️ Add map view to visualize routes and activities
- 🔁 Import/export itinerary as PDF or shareable link
- 🌓 Dark/light mode toggle
- 🌤️ Optional weather integration per destination

---

## 🔌 Suitable APIs

| API | Purpose |
|-----|---------|
| **Google Places API** | Real-time points of interest |
| **Triposo API** | Travel recommendations and content |
| **Google Gemini API** | Personalized, AI-optimized travel planning |
