import { useState, useEffect } from "react";

export const useProperties = () => {
  const [properties, setProperties] = useState([]);

  const fetchProperties = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/properties/get-all-property"
      );
      const data = await response.json();
      setProperties(data);
    } catch (err) {
      console.log(
        err || "Something wrong while fetching the data from backend"
      );
    }
  };


  useEffect(() => {
    fetchProperties();
  }, []);
    const fetchProperties = async () => {
        try {
            const response = await fetch("http://localhost:8080/api/properties/get-all-property");
            const data = await response.json();
            setProperties(data)

  return { properties, refetch: fetchProperties, setProperties };
};

export const useProperty = (id) => {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProperty = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/properties/property/${id}`
      );
      if (!response.ok) throw new Error("Failed to retrieve data");
      const data = await response.json();
      setProperty(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperty();
  }, [id]);

  return { property, loading, error };
};

export const useGeoLocation = () => {
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
    }

    const watcher = navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => {
        setError(err.message);
      }
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  return { location, error };
};
