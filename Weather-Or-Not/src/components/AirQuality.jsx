import { Gauge, Leaf, CloudRain, Wind, Sun, Droplets } from 'lucide-react';

const AirQuality = ({ aqiData }) => {
  if (!aqiData || !aqiData.list || !aqiData.list[0]) {
    return (
      <div className="text-center py-4 text-gray-500">
        Air quality data not available
      </div>
    );
  }

  const { main, components } = aqiData.list[0];
  const aqi = main.aqi;

  // AQI scale information
  const aqiScale = [
    { level: 1, label: "Good", color: "bg-green-500", description: "Air quality is satisfactory" },
    { level: 2, label: "Fair", color: "bg-yellow-500", description: "Acceptable quality" },
    { level: 3, label: "Moderate", color: "bg-orange-500", description: "Sensitive groups affected" },
    { level: 4, label: "Poor", color: "bg-red-500", description: "Health effects possible" },
    { level: 5, label: "Very Poor", color: "bg-purple-500", description: "Health alert" }
  ];

  const currentLevel = aqiScale[aqi - 1];

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-semibold text-gray-800">Air Quality</h3>
      
      {/* AQI Index */}
      <div className={`p-4 rounded-lg text-white ${currentLevel.color}`}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-lg font-medium">Air Quality Index</p>
            <p className="text-4xl font-bold">{aqi} - {currentLevel.label}</p>
          </div>
          <Leaf className="w-10 h-10" />
        </div>
        <p className="mt-2">{currentLevel.description}</p>
      </div>

      {/* Pollutants Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <PollutantCard 
          icon={<CloudRain />}
          name="PM2.5"
          value={components.pm2_5}
          unit="μg/m³"
        />
        <PollutantCard 
          icon={<Wind />}
          name="PM10"
          value={components.pm10}
          unit="μg/m³"
        />
        <PollutantCard 
          icon={<Sun />}
          name="Ozone"
          value={components.o3}
          unit="μg/m³"
        />
        <PollutantCard 
          icon={<Droplets />}
          name="NO₂"
          value={components.no2}
          unit="μg/m³"
        />
        <PollutantCard 
          icon={<Gauge />}
          name="SO₂"
          value={components.so2}
          unit="μg/m³"
        />
        <PollutantCard 
          icon={<Droplets />}
          name="CO"
          value={components.co}
          unit="mg/m³"
        />
      </div>
    </div>
  );
};

// Sub-component for pollutant cards
const PollutantCard = ({ icon, name, value, unit }) => (
  <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-3">
    <div className="p-2 bg-blue-100 rounded-full text-blue-600">
      {icon}
    </div>
    <div>
      <p className="font-medium text-gray-800">{name}</p>
      <p className="text-gray-600">{value} {unit}</p>
    </div>
  </div>
);

export default AirQuality;