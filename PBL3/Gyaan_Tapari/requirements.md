# 🧠 CurioPal (Gyaan Tapari) — The Curious Companion Every Child Deserves

**Category:** Education / Kids

---

## 📚 Overview

CurioPal is a fun, safe, and interactive learning dashboard designed for kids aged 6 to 12. It combines quizzes, trivia, and playful games like Hangman and Typing Race to make learning feel like a game. With AI support, it also simplifies difficult topics and personalizes learning experiences.

**Kids can:**

- ✅ Choose what they want to learn
- ✅ Take fun quizzes and mini-games
- ✅ Earn stars, badges, and track progress
- ✅ Get AI-powered explanations in a friendly way

---

## 🧩 Tier 1: Quiz & Learning Game Dashboard (React Fundamentals)

### Features

- 📖 Choose subjects (Math, Science, English, etc.)
- ❓ Take simple multiple-choice quizzes
- 🌟 Earn stars or badges for correct answers and milestones
- 🧠 Play interactive learning games:
  - **Hangman Game** — spelling & vocabulary
  - **Typing Race Game** — typing speed and accuracy
- 📊 View a kid-friendly progress tracker
- 📱 Fully responsive UI with animations using Tailwind CSS

### Tech Stack

- React with `useState`, `useContext`, and props
- **Core components:** `SubjectSelector`, `QuizCard`, `HangmanGame`, `TypingRaceGame`, `BadgeDisplay`, `ProgressTracker`

---

## 🎉 Tier 2: Trivia & Fun Facts Integration (API Integration)

### APIs

- **Numbers API**
- **Open Trivia DB**

### Features

- 💡 Show random fun facts or trivia based on selected subjects
- 🔄 Refresh trivia each day or on request
- 🎨 Display facts in engaging, colorful cards
- ⚠️ Handle loading, success, and error states

---

## 🤖 Tier 3: Gemini-Powered AI Learning Assistant

Using **Google Gemini API** to:

- 🧒 Explain complex concepts in simple, child-friendly language
- ✏️ Generate personalized quiz or hangman word sets
- 🗣️ Understand free-form kid questions (e.g., "Why do stars twinkle?" → simple response with friendly tone)
- 🎯 Recommend subjects or topics based on previous quiz performance
- 📘 Generate bedtime-style "fun fact stories"

---

## ✨ Optional Enhancements

- 💾 Save user progress, badges, and high scores to localStorage or Firebase
- 🛡️ Include parental controls and safe learning modes
- 🎵 Add sounds, confetti effects, or sticker rewards
- 🌗 Dark/light mode for visual comfort
- 📈 Add dashboard for parents/teachers to view progress reports

---

## 🔌 Suitable APIs

| API | Purpose |
|-----|---------|
| **Open Trivia DB** | Quiz questions and trivia |
| **Numbers API** | Fun number facts |
| **Google Gemini API** | Personalized explanations and quiz generation |
