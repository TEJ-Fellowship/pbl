# 🧾 AI Resume Optimizer — “Apply smarter, stand out faster.”

**Category:** Productivity / Career

---

## 🌍 Overview

A platform where users upload, manage, and optimize their resumes with AI assistance.

**Users can:**

- ✅ Upload, view, and delete resumes
- ✅ Get AI-powered parsing and improvement suggestions (optional)
- ✅ Match their resume against job descriptions

---

## 🧩 Tier 1: Basic Resume Manager (React + Node.js + Express)

### 🔹 Features

- 📤 Upload resume (PDF/DOCX) with title/notes
- 📄 View uploaded resumes
- 🗑️ Delete resumes
- 👀 Preview/download resumes
- 📱 Mobile-responsive UI with Tailwind CSS
- 🌓 Dark/light mode toggle

### 🔹 Tech Stack

- **Frontend:** React (useState, useEffect, props) + Tailwind CSS
- **Backend:** Node.js + Express REST API
- **Storage:** In-memory metadata + disk storage (multer) → later MongoDB integration

### 🔹 Core Components

- `UploadForm`
- `ResumeList`
- `ResumeItem`

### 🔹 Backend Routes (Postman-Testable)

- `POST /resumes` → Upload resume
- `GET /resumes` → Get all resumes
- `GET /resumes/:id/file` → Download/stream file
- `DELETE /resumes/:id` → Delete resume

---

## 🧩 Tier 2: Database Integration (MongoDB + Mongoose)

### 🔹 Features

- 💾 Store resume metadata in MongoDB
- 🔎 Search resumes by title
- 🧭 Persistent storage across reloads

### 🔹 Tech Stack

- **Frontend:** React + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose ODM)

### 🔹 Backend Routes (Postman-Testable)

- `POST /resumes` → Upload & save metadata
- `GET /resumes` → Fetch all resumes
- `GET /resumes/:id/file` → Download file
- `PUT /resumes/:id` → Update title/notes
- `DELETE /resumes/:id` → Delete resume

### 🔹 Optional Enhancements

- Pagination for large collections
- Sort by upload date

---

## 🤖 Tier 3: AI-Powered Parsing & Job Match

### 🔹 Features

- 🧠 **Resume Parsing (NLP):** Extract name, skills, experience, education, achievements
- 📝 **AI Suggestions:** Improvements, missing keywords, formatting hints
- 🎯 **Job Match Scoring:** Match resume against a JD → return `{ score, missingKeywords }`
- 📊 Weekly insights: common skills across user resumes (optional)

### 🔹 Tech Stack

- **Frontend:** React + Tailwind CSS
- **Backend:** Node.js + Express + MongoDB
- **AI Engine (Optional):** Gemini / OpenAI for parsing, suggestions, scoring

### 🔹 Backend Routes (Postman-Testable)

- `POST /ai/parse/:resumeId` → Extract fields
- `POST /ai/suggest/:resumeId` → Suggestions for improvement
- `POST /ai/match` → Compare resume with job description → `{ score, missingKeywords }`

### 🔹 Optional Enhancements

- Export AI-optimized resume as PDF
- Side-by-side resume vs job description comparison

---

## 🔐 Tier 4: User Authentication & Access Control

### 🔹 Features

- 👤 User Registration & Login with JWT
- 🔒 Password hashing with bcrypt
- 📂 Protected routes → Users only access their own resumes
- 👤 Profile management → update name, email, password

### 🔹 Tech Stack

- **Frontend:** React + Tailwind CSS (Login/Signup forms, protected routes)
- **Backend:** Node.js + Express + MongoDB (Users collection)
- **Auth:** JWT + bcrypt

### 🔹 Backend Routes (Postman-Testable)

#### **Auth**

- `POST /auth/register` → Register user
- `POST /auth/login` → Login user
- `GET /auth/me` → Current user info

#### **Resumes (Protected)**

- `GET /resumes` → Get user’s own resumes
- `POST /resumes` → Upload resume (linked to user)
- `GET /resumes/:id/file` → Download if owner
- `PUT /resumes/:id` → Update if owner
- `DELETE /resumes/:id` → Delete if owner

### 🔹 Optional Enhancements

- Email verification for signups
- Password reset via email
