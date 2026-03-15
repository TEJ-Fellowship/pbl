import React, { useState, useEffect, useRef } from "react";

const categories = [
  { label: "Tourist Places" },
  { label: "Cafes" },
  { label: "Restaurants" },
  { label: "Museums" },
];

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

const NearbyPlacesGallery = () => {
  const [category, setCategory] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPlaceIndex, setCurrentPlaceIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [fade, setFade] = useState(true);
  const imageIntervalRef = useRef(null);

  const fetchPlaces = async (cat) => {
    setLoading(true);
    setPlaces([]);
    setCurrentPlaceIndex(0);
    setCurrentImageIndex({});

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      try {
        const query = `${cat.label} near ${lat},${lon}`;
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
            query
          )}&per_page=10&client_id=${UNSPLASH_ACCESS_KEY}`
        );
        const data = await res.json();

        const formattedPlaces = data.results.map((img) => ({
          name: img.alt_description || cat.label,
          images: [img.urls.small, img.urls.thumb],
        }));

        const imgIndexInit = formattedPlaces.reduce((acc, _, i) => {
          acc[i] = 0;
          return acc;
        }, {});

        setPlaces(formattedPlaces);
        setCurrentImageIndex(imgIndexInit);
      } catch (err) {
        console.error(err);
      }

      setLoading(false);
    });
  };

  useEffect(() => {
    if (places.length === 0) return;
    clearInterval(imageIntervalRef.current);
    imageIntervalRef.current = setInterval(() => {
      const total = places[currentPlaceIndex].images.length;
      setCurrentImageIndex((prev) => ({
        ...prev,
        [currentPlaceIndex]:
          (prev[currentPlaceIndex] + 1) % total,
      }));
    }, 3000);

    return () => clearInterval(imageIntervalRef.current);
  }, [places, currentPlaceIndex]);

  const nextPlace = () => {
    setFade(false);
    setTimeout(() => {
      const nextIndex = (currentPlaceIndex + 1) % places.length;
      setCurrentPlaceIndex(nextIndex);
      setFade(true);
      setCurrentImageIndex((prev) => ({ ...prev, [nextIndex]: 0 }));
    }, 300);
  };

  const prevPlace = () => {
    setFade(false);
    setTimeout(() => {
      const prevIndex =
        (currentPlaceIndex - 1 + places.length) % places.length;
      setCurrentPlaceIndex(prevIndex);
      setFade(true);
      setCurrentImageIndex((prev) => ({ ...prev, [prevIndex]: 0 }));
    }, 300);
  };

  const nextImage = () => {
    const total = places[currentPlaceIndex].images.length;
    setFade(false);
    setTimeout(() => {
      setCurrentImageIndex((prev) => ({
        ...prev,
        [currentPlaceIndex]:
          (prev[currentPlaceIndex] + 1) % total,
      }));
      setFade(true);
    }, 300);
  };

  const prevImage = () => {
    const total = places[currentPlaceIndex].images.length;
    setFade(false);
    setTimeout(() => {
      setCurrentImageIndex((prev) => ({
        ...prev,
        [currentPlaceIndex]:
          (prev[currentPlaceIndex] - 1 + total) % total,
      }));
      setFade(true);
    }, 300);
  };

  const currentPlace = places[currentPlaceIndex];

  return (
    <div className="p-6 flex flex-col items-center">
      {!category ? (
        <div className="max-w-md w-full p-4 bg-white shadow-lg rounded-xl">
          <h2 className="text-lg font-semibold mb-4 text-center">
            Select a Category
          </h2>
          <select
            className="w-full p-2 border rounded-md"
            onChange={(e) => {
              const selected = categories.find(
                (c) => c.label === e.target.value
              );
              setCategory(selected);
              fetchPlaces(selected);
            }}
          >
            <option value="">-- Select --</option>
            {categories.map((cat) => (
              <option key={cat.label} value={cat.label}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="relative w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{category.label}</h2>
            <button
              onClick={() => {
                setCategory(null);
                setPlaces([]);
              }}
              className="bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600"
            >
              ✕
            </button>
          </div>

          {loading ? (
            <p>Loading places...</p>
          ) : places.length === 0 ? (
            <p>No images found.</p>
          ) : (
            <div className="relative w-full h-80 bg-white shadow-lg rounded-xl overflow-hidden">
              {/* Previous Place */}
              <button
                onClick={prevPlace}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-70 z-10"
              >
                ◀
              </button>

              {/* Next Place */}
              <button
                onClick={nextPlace}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-70 z-10"
              >
                ▶
              </button>

              {/* Previous Image */}
              <button
                onClick={prevImage}
                className="absolute top-2 left-2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-70 z-10"
              >
                ⇦
              </button>

              {/* Next Image */}
              <button
                onClick={nextImage}
                className="absolute top-2 right-2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-70 z-10"
              >
                ⇨
              </button>

              {/* Image */}
              <div
                className={`w-full h-full transition-opacity duration-500 ${
                  fade ? "opacity-100" : "opacity-0"
                }`}
              >
                <img
                  src={
                    currentPlace.images[currentImageIndex[currentPlaceIndex]] ||
                    "https://via.placeholder.com/400"
                  }
                  alt={currentPlace.name}
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-center font-semibold">
                  {currentPlace.name}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NearbyPlacesGallery;
