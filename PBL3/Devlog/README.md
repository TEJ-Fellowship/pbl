# 🧑‍💻 DevLog — Developer Progress Tracker

**Category:** Developer Tools / Portfolio

---

## 💻 Overview

DevLog is a productivity and portfolio-building tool for developers to log daily/weekly progress, reflect on learning, and track project timelines. Ideal for students, self-learners, and professionals looking to showcase growth or keep learning on track.

**Users can:**

- ✅ Log what they worked on
- ✅ Tag tasks with tech stacks (e.g., React, Node.js)
- ✅ Get smart progress summaries and learning suggestions via AI

---

## 🧩 Tier 1: Developer Logbook (React Fundamentals)

### Features

- 📝 Add daily or weekly logs (e.g., "Fixed bug in authentication flow")
- 🏷️ Tag entries with tech stacks used (React, Node, TypeScript, etc.)
- 📅 Organize logs by date and project
- 📈 Track timeline of project milestones
- 📱 Responsive design with Tailwind CSS

### Tech Stack

- React with `useState`, `useContext`, props
- **Core components:** `LogForm`, `LogList`, `TechTagFilter`, `TimelineTracker`

---

## 🧠 Tier 2: GitHub Integration (API Integration)

### API

- **GitHub API**

### Features

- 🔍 Fetch GitHub commit history for selected repos
- 🔄 Sync commit activity with DevLog entries
- 🧪 Display commits by date, repo, and language
- 📊 Show contribution graph or commit heatmap
- ⚠️ Handle GitHub API auth, loading, and error states

---

## 🤖 Tier 3: AI-Powered Reflection (Gemini Integration)

Using **Google Gemini API** to:

- 🧘 Summarize weekly/monthly developer progress
- 📚 Recommend tutorials or learning paths based on logged tasks
- 🧠 Reflect on skill growth (e.g., "You've been using React frequently. Consider diving into advanced patterns like custom hooks or testing.")
- 📅 Generate weekly reflection notes that can be published as blog entries or journal posts
- 🪄 Accept natural language entries (e.g., "Struggled with APIs today") and return suggestions for learning

---

## ✨ Optional Enhancements

- 💾 Store logs in localStorage or Firebase
- 🌐 Export logs as Markdown for use in portfolio or blog
- 🔗 Link each entry to GitHub PRs, issues, or commits
- 🌓 Dark/light mode toggle
- 📈 Add charts for time spent per tech stack

---

## 🔌 Suitable APIs

| API | Purpose |
|-----|---------|
| **GitHub API** | Developer activity and commit tracking |
| **Google Gemini API** | Smart reflection, learning suggestions, and summaries |
