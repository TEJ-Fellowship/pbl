# 💡 SparkMind — Microlearning Engine for Skill Builders

## 🧠 Overview

SparkMind delivers **2-minute learning bursts** powered by quizzes, flashcards, and AI summaries.  
It’s designed for daily upskilling — whether it’s **product sense**, **market insights**, or **critical thinking**.  
⚡ Fast, 🎯 Personal, 🔁 Habit-forming.

---

## 🧩 Tier 1: Learning Pulse (React Fundamentals)

### 📌 What It Does:

- 🔍 Renders 3 topic: `Product`, `Tech Trends`, `Logic`
- ❓ Take a 5-question quiz: `MCQs` or `True/False`
- 🧾 See your score with **instant feedback/explanation**

### 🔧 Core Components:

- 🎛️ `TopicSelector`
- 🧠 `QuizEngine`
- 🧾 `AnswerFeedback`
- 🏁 `ResultCard`

### 🧰 React Concepts Used:

- ⚙️ `useState`, `useContext`
- 💾 _(Optional)_: `localStorage` for streak tracking

---

## 🧩 Tier 2: External Knowledge (API Integration)

### 🧠 Dynamic Learning via API:

- 🔄 Pull quizzes from:

  - 📚 Open Trivia DB
  - 🧠 Wikipedia snippets (via RapidAPI)

- 🗞️ **Today’s Insight**: bite-sized trivia from:
  - 🚀 NASA
  - 💡 HackerNews
  - 📊 Random Facts API

### 💡 New Features:

- ⚠️ Graceful `error/loading` states
- 🕸️ Use `Axios` or `Fetch`
- 🧰 Add `<Loader />` component (loading spinner)

---

## 🧩 Tier 3: AI-Powered Smart Quizzes (Gemini Integration)

### 🌟 Magic with AI:

- ✍️ User types a topic (e.g., _"Startup Metrics"_)  
  → 🧠 Gemini generates a **custom quiz**
- 📅 **Daily Challenge**: New AI-generated quiz each day
- 🧩 Gemini **adapts questions** to your past scores
- ⚡ **Flash in 5**: AI summarizes articles into flashcards

### 📚 Tech Tip:

Use `Gemini API` (or `OpenAI` as fallback)

---

## 🏅 Bonus Add-Ons

- 🏆 `Leaderboard` (🔒 local only)
- 📤 `Score Sharing`: Export as 📸 image or 🧾 card
- 🔌 `Widget Mode`: Chrome Extension or Sidebar Widget

---

## 🛠️ Tools You’ll Use

- 💻 React (`Vite` preferred)
- 📦 `useState`, `useContext`, `useEffect`
- 🛜 APIs: `Trivia DB`, `RapidAPI`, `Gemini`
- 📁 `localStorage`
- 🎨 _(Optional)_: `TailwindCSS`, `Shadcn/UI` for UI polish
