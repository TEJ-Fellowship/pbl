# 🚀 YC-Style Project Catalog Generator Prompt

## Prompt

You are a world-class product manager and technical mentor.  
Your task is to generate a **catalog of 5–10 startup-flavored project ideas** that:  
- Are **fresh, and YC-inspired** (not generic CRUD apps).  
- Are broken into **progressive tiers** of requirements (Tier 1 → Tier 4).  
- Always include **at least one AI-powered feature** (Gemini, OpenAI, or similar).  
- Are explained simply enough for beginners (Tier 1) but aspirational enough for advanced fellows (Tiers 3–4).  
 
**Stack/technology to use:** [INSERT STACK HERE — e.g. MERN, Next.js + Prisma, Django + React, Flutter + Firebase, etc.]  
**Domain/theme (optional):** [INSERT DOMAIN — e.g. education, healthcare, social, creative, fintech]  
 
---  
 
**Output format per project:**  
 
### [Emoji + Project Name] — *Startup-Flavored Tagline*  
 
**Overview**  
- 1–2 short paragraphs in **YC pitch style** (what it does, who it’s for, why it’s interesting).  
 
**Tier 1: Basic [Chosen Stack] + JWT Auth**  
- Core CRUD functionality (auth, lists, forms, filtering).  
- Tailwind/responsive UI (or stack-appropriate styling).  
- Local state with hooks (`useState`, `useEffect`), light context for auth.  
- 3–4 core components identified.  
 
**Tier 2: Production-Grade State & API Integration**  
- Introduce **global state management** (Redux/Toolkit or `useReducer+Context`).  
- Add **API client/service layer** for networking.  
- Integrate at least **one external API** relevant to the project (display new data in a clear place).  
- Implement **loading/error/empty/skeleton states**.  
- Add search/filter/sort + pagination or infinite scroll.  
- Support **optimistic UI updates with rollback**.  
- Optional: WebSockets, file uploads, or offline sync.  
 
**Tier 3: AI & Growth Hooks**  
- Use Gemini/OpenAI (or similar) to add **at least 2 AI-powered features** (draw ideas from the AI Feature Idea Pack below).  
- Introduce **habit-forming mechanics**: streaks, badges, leaderboards.  
- Growth/viral hook: easy **social sharing**, invite loops, or collaborative features.  
 
**Tier 4: Moonshot**  
- Ambitious features that could **make it a YC-scale product** (e.g., real-time multiplayer, global feed, AI copilots, integrations with external ecosystems).  
- These should feel visionary but still build naturally on Tiers 1–3.  
 
---  
 
**Important Guidelines:**  
- Keep Tier 1 lightweight and achievable by beginners.  
- Make Tier 2 about **real-world state + external data**.  
- Always put **AI features in Tier 3**, not earlier.  
- Tier 4 should inspire, not overwhelm.  
- Use **clear, concise bullet points** for requirements.  

---

# 🤖 AI Feature Idea Packs

Use these packs when generating **Tier 3 (AI & Growth Hooks)** or **Tier 4 (Moonshot)** features.  
Pick 2–3 per project to keep things exciting and varied.

---

## 1. ✨ Personalization & Insights
- **Smart Summaries**: AI generates daily/weekly summaries of user activity.  
- **Pattern Detection**: AI highlights trends (“You study more at night than mornings”).  
- **Goal Recommendations**: Suggests what to do next based on past activity.  
- **Personalized Feed**: Curates content for the user (e.g., recommended notes, stories, or workouts).  

---

## 2. 🗣️ Natural Language Input
- **NLU Forms**: User types “I studied React for 2 hours” → AI parses into structured log.  
- **Chat-to-CRUD**: Users can “talk” to the system (“Add a new task for tomorrow”).  
- **Voice → Structured Data**: Record audio, transcribed + structured by AI.  
- **Conversational Queries**: “Show me my top 5 most active weeks” → AI transforms into filters/queries.  

---

## 3. 🎨 Creative AI
- **Auto-Captions**: AI generates captions for memes, videos, or posts.  
- **Style Transfer**: Convert doodles into pixel art, anime, or futuristic aesthetics.  
- **Generative Content**: Create new memes/images/videos from text prompts.  
- **Remix Engine**: Suggest creative twists on existing user content.  

---

## 4. 📊 Predictive & Analytics AI
- **Outcome Predictions**: “If you continue at this pace, you’ll hit X by next week.”  
- **Anomaly Detection**: Flags unusual behaviors (e.g., sudden drop in activity).  
- **Forecasting**: AI predicts next steps (“Tomorrow you’ll likely…”).  
- **What-If Simulation**: Explore alternate choices in a decision tree.  

---

## 5. 🎮 Gamification & Growth AI
- **AI Challenge Generator**: Creates custom puzzles or tasks daily.  
- **Smart Opponents**: AI acts as a rival in challenges/battles.  
- **Adaptive Difficulty**: Adjusts challenge level
