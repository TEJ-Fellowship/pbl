import axios from "axios";

const MUSIC_APIS = {
  FMA: {
    baseUrl: "https://freemusicarchive.org/api/get",
    key: null, 
  },

  // Jamendo API (Creative Commons music)
  JAMENDO: {
    baseUrl: "https://api.jamendo.com/v3.0",
    clientId: "3e29761c", // Your actual Jamendo Client ID
  },

  AUDIOLIBRARY: {
    baseUrl: "https://audiolibrary.youtube.com/api",
    key: "YOUR_YOUTUBE_API_KEY",
  },

  NEPALI_MUSIC: {
    baseUrl: "https://your-nepali-music-api.com", // Replace with actual Nepali music API
    key: "YOUR_API_KEY",
  },
};

class ExternalMusicService {
  constructor() {
    this.cache = new Map();
  }

  // Search Free Music Archive
  async searchFMA(query, limit = 20) {
    try {
      const cacheKey = `fma_${query}_${limit}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const response = await axios.get(
        `${MUSIC_APIS.FMA.baseUrl}/tracks.json`,
        {
          params: {
            api_key: MUSIC_APIS.FMA.key,
            limit: limit,
            search: query,
          },
        }
      );

      const tracks = response.data.dataset.map((track) => ({
        id: `fma_${track.track_id}`,
        title: track.track_title,
        artist: track.artist_name,
        duration: parseInt(track.track_duration) || 180,
        url: track.track_url,
        genre: track.track_genres?.[0]?.genre_title || "unknown",
        mood: this.detectMood(track.track_title, track.track_genres),
        source: "Free Music Archive",
        license: "Creative Commons",
      }));

      this.cache.set(cacheKey, tracks);
      return tracks;
    } catch (error) {
      console.error("FMA API Error:", error);
      return [];
    }
  }

  // Search Jamendo (Creative Commons)
  async searchJamendo(query, limit = 20) {
    try {
      const cacheKey = `jamendo_${query}_${limit}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const response = await axios.get(`${MUSIC_APIS.JAMENDO.baseUrl}/tracks`, {
        params: {
          client_id: MUSIC_APIS.JAMENDO.clientId,
          format: "json",
          limit: limit,
          search: query,
          include: "musicinfo",
        },
      });

      const tracks = response.data.results.map((track) => ({
        id: `jamendo_${track.id}`,
        title: track.name,
        artist: track.artist_name,
        duration: parseInt(track.duration) || 180,
        url: track.audio,
        genre: track.musicinfo?.tags?.genres?.[0] || "unknown",
        mood: this.detectMood(track.name, track.musicinfo?.tags?.genres),
        source: "Jamendo",
        license: "Creative Commons",
      }));

      this.cache.set(cacheKey, tracks);
      return tracks;
    } catch (error) {
      console.error("Jamendo API Error:", error);
      return [];
    }
  }

  // Search Nepali Music Database
  async searchNepaliMusic(query, limit = 20) {
    try {
      const cacheKey = `nepali_${query}_${limit}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }


      const nepaliDemoTracks = [
        {
          id: "nepali_1",
          title: "Sparsa Sangeet",
          artist: "Nepali Artist",
          duration: 240,
          url: "https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3", // Replace with actual URL
          genre: "nepali",
          mood: "romantic",
          source: "Nepali Music DB",
          license: "Licensed",
          tags: ["nepali", "romantic", "classic"],
        },
        {
          id: "nepali_2",
          title: "Himalayan Melody",
          artist: "Folk Artist",
          duration: 200,
          url: "https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3",
          genre: "folk",
          mood: "peaceful",
          source: "Nepali Music DB",
          license: "Licensed",
          tags: ["nepali", "folk", "peaceful", "traditional"],
        },
      ];

      // Filter by query
      const filtered = nepaliDemoTracks.filter(
        (track) =>
          track.title.toLowerCase().includes(query.toLowerCase()) ||
          track.artist.toLowerCase().includes(query.toLowerCase()) ||
          track.tags.some((tag) =>
            tag.toLowerCase().includes(query.toLowerCase())
          )
      );

      this.cache.set(cacheKey, filtered);
      return filtered;
    } catch (error) {
      console.error("Nepali Music API Error:", error);
      return [];
    }
  }

  // For demonstration, let's create a robust mock search that simulates real API responses
  async searchDemo(query, limit = 20) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const allDemoTracks = [
      {
        id: "demo_1",
        title: "Upbeat Summer Vibes",
        artist: "Demo Artist",
        duration: 180,
        url: "https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3",
        genre: "upbeat",
        mood: "energetic",
        source: "Demo API",
        license: "Royalty Free",
        tags: ["happy", "summer", "upbeat", "energetic"],
      },
      {
        id: "demo_2",
        title: "Chill Acoustic Guitar",
        artist: "Indie Creator",
        duration: 200,
        url: "https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3",
        genre: "acoustic",
        mood: "calm",
        source: "Demo API",
        license: "Creative Commons",
        tags: ["chill", "acoustic", "guitar", "calm", "relaxing"],
      },
      {
        id: "demo_3",
        title: "Epic Cinematic Adventure",
        artist: "Film Composer",
        duration: 240,
        url: "https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3",
        genre: "cinematic",
        mood: "adventurous",
        source: "Demo API",
        license: "Royalty Free",
        tags: ["epic", "cinematic", "adventure", "dramatic", "powerful"],
      },
      {
        id: "demo_4",
        title: "Happy Pop Energy",
        artist: "Pop Star",
        duration: 190,
        url: "https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3",
        genre: "upbeat",
        mood: "energetic",
        source: "Demo API",
        license: "Royalty Free",
        tags: ["happy", "pop", "energy", "dance", "fun"],
      },
      {
        id: "demo_5",
        title: "Emotional Piano Ballad",
        artist: "Classical Artist",
        duration: 210,
        url: "https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3",
        genre: "emotional",
        mood: "nostalgic",
        source: "Demo API",
        license: "Creative Commons",
        tags: ["emotional", "piano", "ballad", "sad", "nostalgic"],
      },
      {
        id: "demo_6",
        title: "Electronic Dance Beat",
        artist: "DJ Producer",
        duration: 195,
        url: "https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3",
        genre: "electronic",
        mood: "energetic",
        source: "Demo API",
        license: "Royalty Free",
        tags: ["electronic", "dance", "beat", "edm", "club"],
      },
      {
        id: "demo_7",
        title: "Romantic Violin",
        artist: "String Ensemble",
        duration: 185,
        url: "https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3",
        genre: "acoustic",
        mood: "romantic",
        source: "Demo API",
        license: "Creative Commons",
        tags: ["romantic", "violin", "love", "classical", "sweet"],
      },
      {
        id: "demo_8",
        title: "Mysterious Dark Ambient",
        artist: "Ambient Artist",
        duration: 220,
        url: "https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3",
        genre: "ambient",
        mood: "mysterious",
        source: "Demo API",
        license: "Royalty Free",
        tags: ["mysterious", "dark", "ambient", "atmospheric", "suspense"],
      },
    ];

    if (!query || query.trim() === "") {
      return allDemoTracks.slice(0, limit);
    }

    const queryLower = query.toLowerCase();
    const filteredTracks = allDemoTracks.filter(
      (track) =>
        track.title.toLowerCase().includes(queryLower) ||
        track.artist.toLowerCase().includes(queryLower) ||
        track.genre.toLowerCase().includes(queryLower) ||
        track.mood.toLowerCase().includes(queryLower) ||
        track.tags.some((tag) => tag.toLowerCase().includes(queryLower))
    );

    return filteredTracks.slice(0, limit);
  }

  // Detect mood from title and genres
  detectMood(title, genres) {
    const titleLower = title.toLowerCase();
    const genreString = Array.isArray(genres)
      ? genres.join(" ").toLowerCase()
      : "";

    if (
      titleLower.includes("happy") ||
      titleLower.includes("upbeat") ||
      genreString.includes("pop")
    ) {
      return "energetic";
    } else if (
      titleLower.includes("chill") ||
      titleLower.includes("relax") ||
      genreString.includes("ambient")
    ) {
      return "calm";
    } else if (
      titleLower.includes("epic") ||
      titleLower.includes("dramatic") ||
      genreString.includes("orchestral")
    ) {
      return "adventurous";
    } else if (titleLower.includes("love") || titleLower.includes("romantic")) {
      return "romantic";
    } else if (titleLower.includes("mystery") || genreString.includes("dark")) {
      return "mysterious";
    } else {
      return "nostalgic";
    }
  }

  // Combined search across multiple APIs
  async searchAll(query, limit = 20) {
    try {
      const searches = [
        this.searchFMA(query, Math.ceil(limit / 4)),
        this.searchJamendo(query, Math.ceil(limit / 4)),
        this.searchNepaliMusic(query, Math.ceil(limit / 4)), // Include Nepali music
        this.searchDemo(query, Math.ceil(limit / 4)), // Keep some demo tracks as fallback
      ];

      const results = await Promise.allSettled(searches);
      const allTracks = results
        .filter((result) => result.status === "fulfilled")
        .flatMap((result) => result.value)
        .slice(0, limit);

      return allTracks;
    } catch (error) {
      console.error("Music search error:", error);
      return [];
    }
  }
}

export default new ExternalMusicService();
