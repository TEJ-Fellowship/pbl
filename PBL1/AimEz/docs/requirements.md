# 🎯 AimEZ — AI-Powered Goal Dashboard + Motivation

## Overview:

AimEZ is a simple yet intelligent personal goal dashboard designed to help users stay focused and consistent. Users can track daily progress on personal goals (like “Exercise” or “Read”), receive motivational insights, and get AI-powered feedback using Gemini. The app gradually evolves from a habit tracker to an intelligent companion with natural language input and smart check-ins.

---

## Tier 1: Goal Tracker (React Fundamentals)

Users can:
● Add new goals (e.g., “Exercise daily”, “Read 10 pages”)  
● Remove existing goals  
● Mark daily goal completion using toggle/check (build a calendar streak system)  
● Categorize goals (e.g., Fitness, Study, Career) using dropdown or tags  
● View a streak calendar for each goal to track consistency (simple row of dots or checkboxes per day)  
● UI should be responsive and mobile-friendly using Tailwind CSS  
● State managed using useState, props, and optionally useContext  
● Basic components: GoalCard, GoalForm, CategoryFilter, StreakCalendar

---

## Tier 2: Motivation Fact API (API Integration)

● Integrate a motivational API (e.g., ZenQuotes or a random fact generator like theysaidso.com)  
● Display the quote or fact in a sticky header or footer on the dashboard  
● Refresh with a new quote each day or via “New Quote” button  
● Handle loading, success, and error states  
● Use fetch or axios to make API requests

---

## Tier 3: Gemini Check-ins (Advanced AI Features)

Use Google Gemini API to:  
● Generate check-in prompts based on current goals (e.g., “How was your meditation today?”)  
● Accept user responses to prompts and generate a reflective summary or encouragement  
● Suggest improvements to habits (e.g., “Try shorter reading sessions if you feel overwhelmed”)  
● Summarize weekly progress across goals in a motivational message (e.g., “You completed 80% of your goals this week — amazing job!”)

---

### Optional:

● Save goal data in localStorage or Firebase for persistence  
● Add analytics charts to visualize progress per category  
● Allow natural language goal creation (e.g., “Start running every morning” auto-parses category and frequency)
