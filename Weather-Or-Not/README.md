# Weather or Not 🌤️

A beautiful, comprehensive weather application that provides current weather conditions and air quality index (AQI) information for cities worldwide, with integrated country selection functionality.

## ✨ Features

### 🌍 Country Selection
- **Popular Countries**: Quick access to weather for major countries
- **Search & Filter**: Search countries by name or capital city
- **Visual Interface**: Country flags and detailed information
- **Responsive Design**: Works seamlessly on desktop and mobile

### 🌤️ Weather Information
- **Current Conditions**: Temperature, weather description, humidity, pressure
- **Feels Like Temperature**: Real-feel temperature
- **Wind Information**: Speed and direction
- **Sun Times**: Sunrise and sunset times
- **Visual Weather Icons**: Dynamic weather condition icons

### 🌬️ Air Quality Index (AQI)
- **Color-Coded AQI**: Visual indicators for air quality levels
  - 🟢 Good (1)
  - 🟡 Fair (2) 
  - 🟠 Moderate (3)
  - 🔴 Poor (4)
  - 🟣 Very Poor (5)
- **Pollutant Breakdown**: PM2.5, PM10, NO₂, O₃ levels
- **Health Impact Information**: Understanding air quality impact

### 🎨 Modern UI/UX
- **Glass-morphism Design**: Beautiful frosted glass effects
- **Gradient Backgrounds**: Stunning visual appeal
- **Responsive Layout**: Mobile-first design
- **Loading States**: Smooth loading animations
- **Error Handling**: User-friendly error messages

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Weather-Or-Not
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up API Key (Optional)**
   - Get a free API key from [OpenWeatherMap](https://openweathermap.org/api)
   - Replace `'your_api_key_here'` in `src/services/weatherService.js` with your actual API key
   - Set `USE_DEMO_DATA` to `false` in `src/services/demoData.js`

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to `http://localhost:5173` (or the port shown in terminal)

## 🔧 Configuration

### Demo Mode
The app includes demo data for testing without API keys:
- **Location**: `src/services/demoData.js`
- **Toggle**: Set `USE_DEMO_DATA = false` to use real API data
- **Includes**: Sample weather data for London, Paris, Tokyo, and New York

### API Integration
To use real weather data:
1. Get API key from [OpenWeatherMap](https://openweathermap.org/api)
2. Update `WEATHER_API_KEY` in `src/services/weatherService.js`
3. Set `USE_DEMO_DATA = false` in `src/services/demoData.js`

## 📱 Usage

### Selecting a Country
1. **Popular Countries**: Click on any flag in the popular countries grid
2. **Search**: Use the search box to find countries by name or capital
3. **Browse**: Click the dropdown arrow to see all available countries

### Viewing Weather
- Weather data automatically loads for the selected country's capital
- Air quality information appears below weather details
- All data updates in real-time when switching countries

### Manual City Search
- Use the search input in the weather card to query specific cities
- Supports city names worldwide
- Weather and AQI data will update accordingly

## 🏗️ Architecture

### Components
```
src/
├── components/
│   ├── WeatherCard.jsx      # Main weather display component
│   ├── WeatherCard.css      # Weather card styling
│   ├── CountrySelector.jsx  # Country selection interface
│   └── CountrySelector.css  # Country selector styling
├── services/
│   ├── weatherService.js    # Weather & AQI API integration
│   ├── coutries_api.js      # Countries data API
│   └── demoData.js          # Demo data for testing
├── App.jsx                  # Main application component
└── App.css                  # Global styling
```

### APIs Used
- **[OpenWeatherMap API](https://openweathermap.org/api)**: Weather and air pollution data
- **[REST Countries API](https://restcountries.com/)**: Country information and flags

## 🎯 Key Features Breakdown

### Air Quality Index Categories
| AQI | Level | Color | Description |
|-----|-------|-------|-------------|
| 1 | Good | 🟢 Green | Air quality is satisfactory |
| 2 | Fair | 🟡 Yellow | Acceptable air quality |
| 3 | Moderate | 🟠 Orange | Unhealthy for sensitive groups |
| 4 | Poor | 🔴 Red | Unhealthy air quality |
| 5 | Very Poor | 🟣 Purple | Very unhealthy air quality |

### Responsive Breakpoints
- **Desktop**: > 640px - Full layout with all features
- **Mobile**: ≤ 640px - Stacked layout, optimized touch targets

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Tech Stack
- **Frontend**: React 19, Vite
- **Styling**: CSS3 with modern features (backdrop-filter, grid, flexbox)
- **APIs**: REST APIs with async/await
- **Build Tool**: Vite with HMR

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Weather data provided by [OpenWeatherMap](https://openweathermap.org/)
- Country data from [REST Countries](https://restcountries.com/)
- Icons and emojis for visual enhancement

---

**Made with ❤️ for weather enthusiasts worldwide** 🌍
