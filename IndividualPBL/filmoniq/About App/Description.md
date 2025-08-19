# Harmoniq: Comprehensive Guide

## Understanding Harmoniq

Harmoniq is an AI-powered music recommendation system that matches songs to your emotional state. It combines mood tracking with sophisticated music discovery, evolving into a personalized emotional companion over time.

## Core Components Breakdown

### 1. Mood Logger & Static Playlist (Tier 1)

- **MoodSelector**: UI component with emoji buttons for mood selection
- **PlaylistDisplay**: Shows songs based on selected mood
- **MoodHistory**: Tracks past mood selections (optional)
- **UI Framework**: Tailwind CSS for responsive design

### 2. Real-Time Playlist Integration (Tier 2)

- **Spotify API**: For fetching real music data
- **Last.fm API**: For music tagging and recommendations
- **Enhanced PlaylistDisplay**: Now shows album art, artist info, etc.

### 3. AI Mood Interpretation (Tier 3)

- **Gemini API**: Analyzes free-text mood inputs
- **Smart Recommendations**: Generates contextual music suggestions
- **Trend Analysis**: Weekly mood patterns (optional)

## Detailed User Flow

1. **Landing Page**

   - Welcomes user with clean interface
   - Prompts to select/log mood

2. **Mood Selection**

   - Option A: Quick emoji selection (😊😢🎉😴)
   - Option B: Free-text journal entry (Tier 3)
   - Submit button

3. **Playlist Generation**

   - Tier 1: Shows static playlist immediately
   - Tier 2: Fetches real playlist from API (loading state)
   - Tier 3: Shows AI-generated recommendation text + playlist

4. **Playlist Interaction**

   - View songs with basic info
   - Play previews (if API supports)
   - Option to refresh playlist
   - Save favorites (enhancement)

5. **History View (Optional)**

   - Calendar/list of past moods
   - Option to revisit past playlists

6. **Settings/Profile**
   - Theme toggle (enhancement)
   - API connection status
   - Data preferences

## Technical Implementation Roadmap

### Phase 1: Static Version

1. Set up React project with Vite
2. Create basic components:
   - `MoodSelector.jsx` (emoji buttons)
   - `PlaylistDisplay.jsx` (hardcoded songs)
   - `App.js` (state management)
3. Style with Tailwind CSS
4. Add simple animations with Framer Motion or CSS transitions

### Phase 2: API Integration

1. Register for Spotify Developer account
2. Implement OAuth flow (or use client credentials)
3. Create API service layer:
   - `spotifyService.js` for API calls
   - Mood-to-genre mapping logic
4. Enhance PlaylistDisplay with real data
5. Add loading/error states

### Phase 3: AI Integration

1. Set up Google AI Studio account
2. Create prompt engineering for mood analysis:
   - Sample: "Analyze this text for emotional tone: [user input]"
   - Output format: {primaryMood, secondaryMood, confidence, recommendedGenres}
3. Build text input component
4. Create recommendation display component

## Reference Websites

1. **Similar Concepts**:

   - [moodfuse.com](https://www.moodfuse.com) - Mood-based music discovery
   - [moodagent.com](https://www.moodagent.com) - Emotional state music player
   - [spotify.com/mood](https://www.spotify.com/mood) - Spotify's mood playlists

2. **API Documentation**:

   - [Spotify Web API](https://developer.spotify.com/documentation/web-api)
   - [Last.fm API](https://www.last.fm/api)
   - [Google Gemini API](https://ai.google.dev/)

3. **UI Inspiration**:

   - [dribbble.com/music-app](https://dribbble.com/tags/music_app)
   - [awwwards.com](https://www.awwwards.com) - Search "music player"
   - [spotify.design](https://spotify.design/) - Spotify's design system

4. **React References**:
   - [React Docs](https://react.dev/)
   - [Tailwind CSS Docs](https://tailwindcss.com/)
   - [Framer Motion](https://www.framer.com/motion/) for animations

## Development Tips

1. **Start Small**: Build the static version first, then add APIs
2. **Mock Data**: Create JSON files with sample playlists for early testing
3. **State Management**: Consider using Zustand or Redux if props get complex
4. **Error Handling**: Plan API fallbacks (e.g., static data if API fails)
5. **Mobile First**: Design for mobile screens initially

## Sample Component Structure

```
/src
  /components
    MoodSelector.jsx
    PlaylistDisplay.jsx
    MoodHistory.jsx
    SongCard.jsx
    LoadingSpinner.jsx
  /services
    spotifyAPI.js
    lastfmAPI.js
    geminiService.js
  /utils
    moodMappings.js
    helpers.js
  /assets
    moodIcons/
    samples/
  App.jsx
  main.jsx
```

Would you like me to elaborate on any specific aspect of this plan?
