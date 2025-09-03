import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MapPicker = ({
  initialLat = 27.7,
  initialLng = 85.3,
  onLocationSelect,
}) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);

  useEffect(() => {
    // Initialize map
    const map = L.map(mapRef.current).setView([lat, lng], 13);

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Add initial marker
    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    markerRef.current = marker;

    // On map click
    map.on("click", (e) => {
      const { lat: newLat, lng: newLng } = e.latlng;
      setLat(newLat);
      setLng(newLng);

      marker.setLatLng([newLat, newLng]);

      if (onLocationSelect) {
        onLocationSelect({ lat: newLat, lng: newLng });
      }
    });

    // On marker drag
    marker.on("dragend", (e) => {
      const position = e.target.getLatLng();
      setLat(position.lat);
      setLng(position.lng);

      if (onLocationSelect) {
        onLocationSelect({ lat: position.lat, lng: position.lng });
      }
    });

    return () => map.remove();
  }, []);

  return (
    <div>
      <div
        ref={mapRef}
        style={{ height: "300px", width: "100%", borderRadius: "8px" }}
      ></div>
      <p className="text-sm text-gray-600 mt-2">
        Selected Location: {lat.toFixed(6)}, {lng.toFixed(6)}
      </p>
    </div>
  );
};

export default MapPicker;
