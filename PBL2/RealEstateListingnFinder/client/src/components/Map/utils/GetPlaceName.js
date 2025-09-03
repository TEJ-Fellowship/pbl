export const getPlaceName = async (lat, lng) => {
  if (!lat || !lng) return "Unknown location";

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await res.json();
    const arr = data.display_name.split(",") || "Unknown location";
    const loc = arr.slice(0, 3).join(",");
    return loc;
  } catch (error) {
    console.error("Error fetching location name:", error);
    return "Unknown location";
  }
};
