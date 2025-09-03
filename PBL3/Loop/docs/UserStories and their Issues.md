# 🎨 Loop – User Stories & Issues  

## 🟢 Tier 1: Basic MERN + JWT  

### User Stories  
- As a **user**, I want to **sign up/login securely**, so my doodles are tied to my account.  
- As a **user**, I want to **create or join a doodle room** with a unique code, so I can collaborate.  
- As a **player**, I want to **draw on a shared canvas**, so my friends can see my doodles in real time.  
- As a **player**, I want to **save the final doodle**, so we can look back at our creation.  

### Issues  
- [ ] Implement JWT-based signup/login system  
- [L-⌛] Create Room model + join/create API  
- [ ] Build `CanvasBoard` with drawing tools  
- [ ] Add save/export feature (basic JSON of strokes)  
- [L-⌛ ] UI Components: `AuthForm`, `RoomList`, `RoomPage`  

---

## 🟡 Tier 2: Advanced State + API  

### User Stories  
- As a **player**, I want the **canvas state synced across users**, so everyone sees updates live.  
- As a **user**, I want **background images from Unsplash**, so doodles feel creative.  
- As a **player**, I want to **export doodles as PNGs**, so I can share them outside the app.  
- As a **user**, I want to **see loading/errors**, so I know what’s happening in the app.  

### Issues  
- [ ] Add reducer/state manager for canvas updates  
- [ ] Integrate Unsplash API for random backgrounds  
- [ ] Implement PNG export of canvas  
- [ ] Add error/loading UI states  

---

## 🔵 Tier 3: AI & Growth Hooks  

### User Stories  
- As a **player**, I want **AI captions for doodles**, so they’re funnier.  
- As a **player**, I want to **apply art styles (pixel/anime)** to doodles, so they look cool.  
- As a **community member**, I want to **vote for funniest doodles**, so we can highlight weekly winners.  

### Issues  
- [ ] Integrate Gemini API for captions  
- [ ] Add doodle stylization (pixel/anime filters)  
- [ ] Create `Vote` model + voting API  
- [ ] Build weekly “Top Doodles” leaderboard page  

---

## 🚀 Tier 4: Moonshot  

### User Stories  
- As a **player**, I want **multiplayer doodle battles**, so teams can compete.  
- As a **community member**, I want the **AI to finish unfinished doodles**, so the game feels magical.  
- As a **community member**, I want to **contribute to an infinite mural**, so we create something massive together.  

### Issues  
- [ ] Implement doodle battle mode (timed rounds, teams)  
- [ ] Integrate AI doodle completion  
- [ ] Add `MuralTile` model + mural grid API  
- [ ] Build real-time mural rendering  


---
## 🔴 NOTE:
- L stands for Lokesh
- A stands for Anjana
- ✅ stands for Completed
- ⌛ stands for Ongoing
- ➖ stands for Stucked at somepoint.
