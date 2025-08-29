import React, { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Set view helper
const SetView = ({ coords, zoom = 13 }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView(coords, zoom);
  }, [coords, zoom, map]);
  return null;
};

const Maps = () => {
  const [currentCoords, setCurrentCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [stops, setStops] = useState([]);
  const [routeStarted, setRouteStarted] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const [checkpoints, setCheckpoints] = useState(() => {
    const saved = localStorage.getItem("checkpoints");
    return saved ? JSON.parse(saved) : [];
  });

  const GRAPHOPPER_KEY = import.meta.env.VITE_GRAPHOPPER_KEY;

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentCoords([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        alert("Error getting your location: " + err.message);
      }
    );
  }, []);

  useEffect(() => {
    localStorage.setItem("checkpoints", JSON.stringify(checkpoints));
  }, [checkpoints]);

  // const geocode = async (place) => {
  //   const res = await fetch(
  //     `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
  //       place
  //     )}`
  //   );
  //   const data = await res.json();
  //   if (data && data.length > 0) {
  //     return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  //   }
  //   throw new Error(`Could not find location for "${place}"`);
  // };

const geocode = async (place) => {
  const res = await fetch(
    `https://graphhopper.com/api/1/geocode?q=${encodeURIComponent(place)}&locale=en&limit=1&key=${GRAPHOPPER_KEY}`
  );

  if (!res.ok) throw new Error("Geocoding request failed");

  const data = await res.json();

  if (data.hits && data.hits.length > 0) {
    return { lat: data.hits[0].point.lat, lng: data.hits[0].point.lng };
  }

  throw new Error(`Could not find location for "${place}"`);
};



  const coordsEqual = (a, b, tol = 1e-5) => {
    if (!a || !b) return false;
    return Math.abs(a[0] - b[0]) < tol && Math.abs(a[1] - b[1]) < tol;
  };

  const makeNumberedIcon = (num) =>
    L.divIcon({
      className: "",
      html: `
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white text-sm font-bold border-2 border-black shadow-md">
          ${num}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

  const handleStartTravel = async () => {
    try {
      if (!currentCoords) {
        alert("Current location not available yet.");
        return;
      }

      setLoadingRoute(true);

      const tripDataStr = localStorage.getItem("tripData");
      const tripData = tripDataStr ? JSON.parse(tripDataStr) : null;
      const destinationName = tripData?.destination;

      if (!destinationName) {
        alert("Destination not found in localStorage");
        setLoadingRoute(false);
        return;
      }

      const dest = await geocode(destinationName);
      setDestCoords([dest.lat, dest.lng]);

      // GraphHopper request
      const ghUrl = `https://graphhopper.com/api/1/route?point=${currentCoords[0]},${currentCoords[1]}&point=${dest.lat},${dest.lng}&vehicle=car&locale=en&points_encoded=false&key=${GRAPHOPPER_KEY}`;

      const res = await fetch(ghUrl);
      const data = await res.json();

      if (!data.paths || data.paths.length === 0) {
        alert("No route found");
        setLoadingRoute(false);
        return;
      }

      const coords = data.paths[0].points.coordinates.map(([lng, lat]) => [
        lat,
        lng,
      ]);
      setRouteCoords(coords);

      // Create stops every 5th point for markers
      const filtered = coords
        .filter((_, idx) => idx % 5 === 0)
        .map((pt) => ({ lat: pt[0], lng: pt[1] }));

      setStops(filtered);
      setRouteStarted(true);
    } catch (error) {
      alert("Route error: " + error.message);
      console.error(error);
    } finally {
      setLoadingRoute(false);
    }
  };

  useEffect(() => {
    const arr = stops.map((stop, index) => ({
      id: index + 1,
      name: `Stop ${index + 1}`,
      coords: [stop.lat, stop.lng],
      completed: false,
    }));
    setCheckpoints(arr);
  }, [stops]);

  const stopMarkers = useMemo(
    () =>
      stops.map((s, i) => (
        <Marker
          key={`stop-${i}`}
          position={[s.lat, s.lng]}
          icon={makeNumberedIcon(i + 1)}
        >
          <Popup>
            <div>
              <strong>Stop {i + 1}</strong>
              <div>
                Lat: {s.lat.toFixed(5)}, Lng: {s.lng.toFixed(5)}
              </div>
            </div>
          </Popup>
        </Marker>
      )),
    [stops]
  );

  return (
    <div className="flex flex-col ">
      {!currentCoords && (
        <p className="text-center text-gray-400 font-semibold">
          Loading your current location...
        </p>
      )}

      {currentCoords && (
        <div className="h-[320px] w-full rounded-md overflow-hidden shadow-lg">
          <MapContainer center={currentCoords} zoom={12} className="h-full w-full">
            <SetView coords={currentCoords} zoom={12} />
            {/* Keep dark Carto basemap */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
              subdomains={["a", "b", "c", "d"]}
              maxZoom={19}
            />

            <Marker position={currentCoords}>
              <Popup>
                <strong>Your location</strong>
              </Popup>
            </Marker>

            {routeStarted && destCoords && (
              <Marker position={destCoords}>
                <Popup>
                  <strong>Destination</strong>
                </Popup>
              </Marker>
            )}

            {routeStarted && stopMarkers}

            {routeStarted && routeCoords.length > 0 && (
              <Polyline
                positions={routeCoords}
                pathOptions={{ color: "#1db954", weight: 4 }}
              />
            )}
          </MapContainer>
        </div>
      )}

      <button
        onClick={handleStartTravel}
        className="w-full py-2 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md transition duration-200 mt-4"
        disabled={loadingRoute}
      >
        {loadingRoute ? "Routing..." : "Start Travel"}
      </button>
    </div>
  );
};

export default Maps;
