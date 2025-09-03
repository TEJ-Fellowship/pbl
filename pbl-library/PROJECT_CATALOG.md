# 📚 TEJ Center Project Catalog
*Startup-inspired MERN projects for fellows*  

Each project is broken into progressive tiers:  
- **Tier 1:** Basic MERN + JWT (CRUD, auth, forms, lists)  
- **Tier 2:** Advanced state management + external API integration  
- **Tier 3:** AI + growth hooks (habit-forming features)  
- **Tier 4:** Moonshot (wild but inspiring extensions)  

---

## 🎤 Huddle — *Micro-Podcasts for Your Inner Circle*  

**Overview**  
Huddle creates a space for short voice updates. Instead of long podcasts or chaotic voice notes, users share 60-second clips that build daily rhythms with friends, classes, or teams. It’s intimacy + structure in audio form.  
YC bet: **audio-first social media for intimacy, not virality.**

**Tier 1: Basic MERN + JWT**  
- JWT signup/login/logout  
- Record & upload ≤60s audio notes  
- List user’s own notes chronologically  
- Simple audio player  
- Components: `AuthForm`, `Recorder`, `Feed`, `NoteCard`  

**Tier 2: Advanced State + API**  
- Reducer/Redux feed state  
- Speech-to-text transcription API  
- Error/loading UI for playback  
- Stretch: hashtags  

**Tier 3: AI & Growth Hooks**  
- Gemini AI weekly summaries of notes  
- Suggest hashtags or titles  
- Topic maps over time  
- Growth: share notes externally  

**Tier 4: Moonshot**  
- Auto-curated playlists  
- AI voice cloning  
- Public channels/networks  

---

## 🕹️ SkillArena — *Micro-Challenges, One Minute a Day*  

**Overview**  
SkillArena is Wordle for learning. Every day, users get a bite-sized coding, trivia, or logic puzzle solvable in under a minute. It’s playful, habit-forming, and inherently viral (“Did you solve today’s challenge?”).  
YC bet: **make practice addictive, not overwhelming.**

**Tier 1: Basic MERN + JWT**  
- JWT signup/login  
- Daily challenge (static JSON)  
- Submit answer & get result  
- View challenge history  
- Components: `AuthForm`, `ChallengeCard`, `AnswerForm`, `HistoryList`  

**Tier 2: Advanced State + API**  
- Reducer for challenge/answer state  
- Trivia API integration  
- Handle wrong answers + retries  
- Stretch: leaderboard of fastest solvers  

**Tier 3: AI & Growth Hooks**  
- Gemini AI generates new daily challenges  
- AI hints/feedback on wrong answers  
- Gamification: streaks, badges, XP points  
- Growth: share solved challenges  

**Tier 4: Moonshot**  
- Real-time group challenge battles  
- Personalized difficulty curve  
- Earn credits for rewards/perks  

---

## 🧩 MemeStack — *Build Memes Together, Layer by Layer*  

**Overview**  
MemeStack reimagines memes as multiplayer culture. Upload a base image, add captions, remix others’ creations — memes evolve socially into “stacks.”  
YC bet: **participatory internet culture beyond one-off memes.**

**Tier 1: Basic MERN + JWT**  
- JWT signup/login  
- Upload base image  
- Add captions  
- View personal meme gallery  
- Components: `AuthForm`, `MemeUpload`, `MemeList`, `MemeCard`  

**Tier 2: Advanced State + API**  
- Reducer/Redux meme state  
- ImgFlip meme template API  
- Support multiple caption layers  
- Stretch: meme remixing  

**Tier 3: AI & Growth Hooks**  
- Gemini AI suggests captions  
- “Explain this meme” mode for fun  
- Growth: share memes externally  
- Optional: trending feed  

**Tier 4: Moonshot**  
- AI meme generation from text prompts  
- Meme tournaments/brackets  
- Meme NFT marketplace  

---

## 🕶️ Glimpse — *One-Second Video Journals*  

**Overview**  
Glimpse captures 1-second daily videos. Over time, users build emotional highlight reels — short, bingeable, and memorable.  
YC bet: **micro video is the default unit of memory.**

**Tier 1: Basic MERN + JWT**  
- JWT signup/login  
- Upload 1-second clip daily  
- Grid/timeline of past clips  
- Components: `AuthForm`, `VideoUpload`, `TimelineGrid`, `Navbar`  

**Tier 2: Advanced State + API**  
- Reducer for clip state  
- Cloudinary thumbnails  
- Export monthly montage  
- Error/loading handling  

**Tier 3: AI & Growth Hooks**  
- Gemini AI monthly summaries  
- Auto-caption videos  
- Growth: share montages  

**Tier 4: Moonshot**  
- AI music scoring  
- Group timelines  
- Time capsule mode  

---

## 🎲 Spindle — *Group Decisions, Settled Fast*  

**Overview**  
Spindle replaces chaotic group chats with quick polls. Create → vote → decide instantly. Perfect for “where should we eat?” or remote team choices.  
YC bet: **micro-polls as viral group coordination tool.**

**Tier 1: Basic MERN + JWT**  
- JWT signup/login  
- Create poll  
- Vote once per user  
- See live results  
- Components: `AuthForm`, `PollForm`, `PollList`, `PollPage`  

**Tier 2: Advanced State + API**  
- Reducer for poll state  
- Giphy API for reaction GIFs  
- Auto-close polls after timer  
- Error/loading handling  

**Tier 3: AI & Growth Hooks**  
- Gemini AI suggests poll options  
- Summarize long option lists  
- Growth: external sharing (Slack/WhatsApp)  

**Tier 4: Moonshot**  
- Decision battles  
- AI compromise negotiator  
- Public trending polls feed  

---

## 🎨 Loop — *Collaborative Doodles in Real Time*  

**Overview**  
Loop is multiplayer doodling: friends take turns adding to a shared canvas. Half art, half game — chaotic collaborative creations.  
YC bet: **shared creativity as entertainment.**

**Tier 1: Basic MERN + JWT**  
- JWT signup/login  
- Create/join doodle room  
- Draw on basic canvas  
- Save final doodle  
- Components: `AuthForm`, `CanvasBoard`, `RoomList`, `RoomPage`  

**Tier 2: Advanced State + API**  
- Reducer for canvas state  
- Unsplash background integration  
- Error/loading states  
- Export doodles as PNGs  

**Tier 3: AI & Growth Hooks**  
- Gemini AI captions doodles  
- Stylize into pixel/anime art  
- Growth: funniest doodles of week  

**Tier 4: Moonshot**  
- Multiplayer doodle battles  
- AI completes unfinished doodles  
- Infinite community mural  

---

## 📢 Echo — *Anonymous Audio Confessions*  

**Overview**  
Echo is an anonymous audio-first network. Record short voice notes anonymously, others listen, react, and upvote. Vulnerable, raw, and human.  
YC bet: **voice as the new anonymous medium.**

**Tier 1: Basic MERN + JWT**  
- JWT signup/login  
- Record/upload audio anonymously  
- Browse feed  
- React with emoji  
- Components: `AuthForm`, `Recorder`, `Feed`, `ClipCard`  

**Tier 2: Advanced State + API**  
- Reducer for feed state  
- Whisper transcription → searchable text  
- Trending feed  
- Error/loading handling  

**Tier 3: AI & Growth Hooks**  
- Gemini AI sentiment analysis  
- Auto-categorize by theme  
- Growth: “confession of the day”  

**Tier 4: Moonshot**  
- AI-powered anonymous conversations  
- Geo-based confession feeds  
- Audio collages  

---

## 🧠 MindMeld — *Crowdsourced Micro-Wisdom*  

**Overview**  
MindMeld is a collective brain of wisdom. Users post tiny life lessons, others upvote, remix, and chain them into evolving insight clusters.  
YC bet: **crowdsourced wisdom > Google results.**

**Tier 1: Basic MERN + JWT**  
- JWT auth  
- Post/edit/delete short “wisdom” notes  
- Personal notes list  
- Components: `AuthForm`, `NoteForm`, `NoteList`, `NoteCard`  

**Tier 2: Advanced State + API**  
- Reducer note state  
- Daily quote API integration  
- Tagging system  

**Tier 3: AI & Growth Hooks**  
- Gemini AI clusters notes by themes  
- AI summaries of your top insights  
- Growth: share cards  

**Tier 4: Moonshot**  
- Global wisdom map  
- AI “elder” chatbot trained on database  

---

## 🎮 GameTape — *Your Play, Replayed*  

**Overview**  
GameTape lets gamers upload quick highlights, annotate them, and share micro-moments. TikTok for gameplay highlights, but intimate to friend groups.  
YC bet: **every gamer is a streamer for their own circle.**

**Tier 1: Basic MERN + JWT**  
- JWT auth  
- Upload ≤30s video clips  
- Personal highlight reel  
- Components: `AuthForm`, `VideoUpload`, `ClipList`, `ClipCard`  

**Tier 2: Advanced State + API**  
- Reducer video state  
- Cloudinary for thumbnails  
- Tags (#win, #fail)  

**Tier 3: AI & Growth Hooks**  
- Gemini AI labels clips (“epic fail,” “victory”)  
- AI hype captions  
- Growth: Discord integration  

**Tier 4: Moonshot**  
- Real-time auto-clipping  
- AI highlight compilations  

---

## 🪞 Doppel — *What Would Future You Say?*  

**Overview**  
Doppel is journaling with a twist: your “future self” talks back. Write reflections, and AI responds as Future You with encouragement or perspective.  
YC bet: **personal AI time-travel for growth.**

**Tier 1: Basic MERN + JWT**  
- JWT auth  
- Write journal entries  
- View past entries  
- Components: `AuthForm`, `EntryForm`, `EntryList`, `EntryCard`  

**Tier 2: Advanced State + API**  
- Reducer entry state  
- Daily inspirational quote API  
- Mood tags  

**Tier 3: AI & Growth Hooks**  
- Gemini AI: generate “Future You” responses  
- Weekly AI growth summaries  
- Growth: share anonymized reflections  

**Tier 4: Moonshot**  
- AI voice clone as Future You  
- Time capsule journaling  

---

## 🪩 Ripple — *One Tap, Global Social Chain*  

**Overview**  
Ripple is a one-button social network. Tap → ripple out → friends tap back. Creates synchronous “waves” of activity across networks.  
YC bet: **a viral mechanic built on minimal input.**

**Tier 1: Basic MERN + JWT**  
- JWT auth  
- “Tap” button sends ripple  
- View ripple history  
- Components: `AuthForm`, `RippleButton`, `RippleFeed`  

**Tier 2: Advanced State + API**  
- Reducer ripple state  
- Random activity/quote API with ripple  
- Ripple streak counter  

**Tier 3: AI & Growth Hooks**  
- Gemini AI suggests ripple messages  
- AI mood sentiment across ripples  
- Growth: ripple badges, “largest ripple”  

**Tier 4: Moonshot**  
- Global ripple map  
- AI ripple forecasts  

---

## 🗺️ PathFinder — *Decisions as Choose-Your-Own-Adventure*  

**Overview**  
PathFinder turns decisions into branching story trees. Log choices, track outcomes, and visualize your decision graph.  
YC bet: **apply narrative to life’s choices.**

**Tier 1: Basic MERN + JWT**  
- JWT auth  
- Add/edit/delete decision nodes  
- Build decision tree  
- Components: `AuthForm`, `DecisionForm`, `DecisionTree`, `NodeCard`  

**Tier 2: Advanced State + API**  
- Reducer tree state  
- Motivational quote API  
- Export tree as PNG  

**Tier 3: AI & Growth Hooks**  
- Gemini AI analyzes decision patterns  
- AI “alternate endings”  
- Growth: share anonymized decision graphs  

**Tier 4: Moonshot**  
- AI outcome predictor  
- Collaborative decision trees  

---
