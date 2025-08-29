import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useGeoLocation } from "../../hooks/useProperties";
import { Viewer } from "mapillary-js";

const MapwithStreetView = ({ initialLat, initialLng }) => {
  const mapRef = useRef(null);
  const streetRef = useRef(null);
  const viewerRef = useRef(null);

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [hasStreetView, setHasStreetView] = useState(false);
  const { location } = useGeoLocation();

  const lat = location.lat || initialLat;
  const lng = location.lng || initialLng;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!lat || !lng) return;
    const map = L.map(mapRef.current).setView([lat, lng], 16);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup("Click to see street view");

    marker.on("click", () => {
      setSelectedLocation({ lat, lng });
    });

    return () => map.remove();
  }, [lat, lng]);

  // Fetch closest Mapillary image ID
  const fetchClosestImageId = async (lat, lng) => {
    const accessToken = "24263413390010090"; // your token from Mapillary dashboard

    try {
      const res = await fetch(
        `https://graph.mapillary.com/images?access_token=${accessToken}&fields=id&closeto=${lat},${lng}&limit=1`
      );
      const data = await res.json();
      console.log("API Response:", data);

      if (!data.data || data.data.length === 0) {
        console.warn("No street view available at this location");
        setHasStreetView(false);
        return null;
      }
      setHasStreetView(true);
      return data.data[0].id;
    } catch (err) {
      console.error("Error fetching Mapillary image:", err);
      setHasStreetView(false);
      return null;
    }
  };

  // Load street view
  useEffect(() => {
    if (!selectedLocation) return;

    const loadStreetView = async () => {
      const imageId = await fetchClosestImageId(37.7749, 122.4194);
      if (!imageId) return;

      // Remove previous viewer
      if (viewerRef.current) {
        viewerRef.current.remove();
        viewerRef.current = null;
      }

      viewerRef.current = new Viewer({
        container: streetRef.current,
        imageId: imageId,
        accessToken: accessToken,
      });
    };

    loadStreetView();
  }, [selectedLocation]);

  return (
    <div className="flex flex-col gap-4">
      <div ref={mapRef} style={{ height: "400px", width: "100%" }}></div>
      {hasStreetView ? (
        <div ref={streetRef} style={{ height: "400px", width: "100%" }}></div>
      ) : (
        <p className="text-center text-gray-500">
          No street view available at this location.
        </p>
      )}
    </div>
  );
};

export default MapwithStreetView;
