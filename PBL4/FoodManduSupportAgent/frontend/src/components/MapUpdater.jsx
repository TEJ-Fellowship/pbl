/**
 * Map Updater Component
 * Updates only the map/location data without re-rendering the entire component
 */

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

export default function MapUpdater({ location, center }) {
  const map = useMap();
  const prevLocationRef = useRef(null);

  useEffect(() => {
    if (location && location.lat !== 0 && location.lng !== 0) {
      const newCenter = [location.lat, location.lng];
      const prevCenter = prevLocationRef.current;

      // Only update if location has changed significantly (more than ~10 meters)
      if (
        !prevCenter ||
        Math.abs(prevCenter[0] - newCenter[0]) > 0.0001 ||
        Math.abs(prevCenter[1] - newCenter[1]) > 0.0001
      ) {
        map.setView(newCenter, map.getZoom(), { animate: true });
        prevLocationRef.current = newCenter;
      }
    } else if (center && center[0] && center[1]) {
      // Fallback to provided center
      map.setView(center, map.getZoom());
    }
  }, [location, center, map]);

  return null;
}
