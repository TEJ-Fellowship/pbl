import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useGeoLocation } from "../../hooks/useProperties";
import { Viewer } from "mapillary-js";

const MapwithStreetView = ({ initialLat, initialLng }) => {
  const mapRef = useRef(null);
  const streetRef = useRef(null);

  const [selectedLocation, setSelectedLocation] = useState(null);
  const { location } = useGeoLocation();

  const lat = location.lat || initialLat;
  const lng = location.lng || initialLng;

  useEffect(() => {
    if (!lat || !lng) return;
    const map = L.map(mapRef.current).setView([lat, lng], 16);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreeMap contributors",
    }).addTo(map);

    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup("Click to see street view");

    marker.on("click ", () => {
      setSelectedLocation({ lat, lng });
    });

    return () => map.remove();
  }, [lat, lng]);

  useEffect(() => {
    if (!selectedLocation) return;

    const viewer = new Viewer({
      container: streetRef.current,
      imageId: "513329829669721",
      accessToken: "MLY|24263413390010090|3066b8eb8bfb71fb84e8f19ef1d6c9f5",
    });

    return () => viewer.remove();
  }, [selectedLocation]);

  return (
    <div className="flex flex-col gap-4">
      <div ref={mapRef} style={{ height: "400px", width: "100%" }}></div>
      {/* <div ref={streetRef} style={{ height: "400px", width: "100%" }}></div> */}
    </div>
  );
};

export default MapwithStreetView;
