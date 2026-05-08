export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000"; //If API_BASE_URL is not set, use the default value

if (!API_BASE_URL) {
  //If API_BASE_URL is not set, throw an error
  throw new Error("API_BASE_URL is not set");
}
