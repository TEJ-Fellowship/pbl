## Weather App

A modern, interactive weather dashboard built with React, providing real-time weather, air quality, city facts, and news for any city worldwide. The app features a beautiful UI with dynamic backgrounds, recent search history, and AI-powered news and city information.

## Features

- **City Weather:** View current temperature, humidity, wind, and weather conditions for any city.
- **Air Quality:** Get real-time AQI and pollutant breakdowns.
- **City Info:** Discover interesting facts about cities, powered by Gemini AI.
- **News:** Read the latest news headlines related to the city, with options for standard news and Gemini AI-generated news.
- **Temperature Trends:** Visualize 5-day temperature trends with interactive charts.
- **Recent Searches:** Quickly access and manage your recent city searches.
- **Dynamic Backgrounds:** Enjoy city-specific background images.
- **Responsive Design:** Optimized for desktop and mobile devices.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/weather-app.git
   cd weather-app
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure API Keys:**

   Create a `.env` file or update the `config.js` file with your API keys:

   - **OpenWeatherMap API Key**
   - **Pexels (or Unsplash) API Key for backgrounds**
   - **Gemini AI API Key** (for city info and AI news)
   - **News API Key** (for standard news)

   Example `.env`:

   ```
   REACT_APP_OPENWEATHER_API_KEY=your_openweather_key
   REACT_APP_BG_API_KEY=your_pexels_key
   REACT_APP_GEMINI_API_KEY=your_gemini_key
   REACT_APP_NEWS_API_KEY=your_newsapi_key
   VITE_API_URL=openweather_map_url
   VITE_BG_URL=pexels_url

   ```

4. **Start the development server:**

   ```bash
   npm start
   # or
   yarn start
   ```

   The app will be available at [http://tej-weather-app.onrender.com](http://localhost:3000).

## Usage

- **Search for a City:** Use the search bar to find weather and info for any city.
- **Switch Tabs:** Use the navigation menu to view Weather, Air Quality, City Info, or News.
- **Recent Searches:** Click "Latest Locations" to revisit or manage your recent searches.
- **Temperature Chart:** Click the chart icon next to the city name to view the 5-day temperature trend.
- **News Source Toggle:** In the News tab, switch between Standard News and Gemini AI News.
- **Remove/Clear Searches:** Remove individual recent searches or clear all at once.

## Project Structure

```
weather-app/
├── public/
├── src/
│   ├── api/                # API calls (weather, forecast, AQI, backgrounds, city info, news)
│   ├── components/         # UI components (SearchBar, WeatherHeader, Chart, etc.)
│   ├── hooks/              # Custom React hooks (e.g., useRecentSearches)
│   ├── styles/             # CSS files
│   ├── App.jsx             # Main app component
│   └── index.js            # Entry point
├── package.json
└── README.md
```

## Key Technologies

- **React** (with hooks)
- **Tailwind CSS** (or custom CSS for styling)
- **Chart.js** (for temperature trends)
- **OpenWeatherMap API** (weather and AQI)
- **Pexels/Unsplash API** (background images)
- **Gemini AI API** (city facts and AI news)
- **NewsAPI** (standard news)

## Customization

- **Default City:** Change the default city in `App.jsx` (`Kathmandu` by default).
- **API Providers:** Swap out background or news APIs as needed.
- **Styling:** Customize styles in `styles/App.css` or Tailwind config.

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements or bug fixes.

## Acknowledgements

- [OpenWeatherMap](https://openweathermap.org/)
- [Pexels](https://www.pexels.com/) / [Unsplash](https://unsplash.com/)
- [NewsAPI](https://newsapi.org/)
- [Google Gemini AI](https://ai.google.dev/)
- [Chart.js](https://www.chartjs.org/)

## Contact

For questions or support, please contact [sankar.jt68@gmail.com][sunzeevraee@gmail.com].

```


```

```

```
