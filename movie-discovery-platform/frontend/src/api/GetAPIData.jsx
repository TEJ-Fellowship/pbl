// api/GetAPIData.jsx

// The loader function provided by React Router DOM receives an object
// containing properties like 'request'. We destructure it here.
const getMoviesData = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get("search"); // Get the value of the 'search' query parameter

    // Define the default search term if no 'search' parameter is provided
    // This will be used when the user first navigates to /movie without a specific search
    const defaultSearchQuery = "movie"; // Or "batman", "superman", etc.

    // Construct the API URL. Use the searchTerm if available, otherwise use the default.
    const apiUrl = `https://www.omdbapi.com/?apikey=${
      import.meta.env.VITE_API_KEY
    }&s=${searchTerm || defaultSearchQuery}&page=1`; // Added page=1 for consistency

    const response = await fetch(apiUrl);

    if (!response.ok) {
      // If the response is not OK (e.g., 404, 500), throw an error
      // React Router's errorElement will catch this
      throw new Response("Failed to fetch movies data.", { status: response.status });
    }

    const data = await response.json();

    console.log(data);


    // The OMDb API returns "Response": "False" if no movies are found.
    // We should handle this gracefully.
    if (data.Response === "True") {
      console.log(data);
      return data; // Returns an object like { Search: [], totalResults: "...", Response: "True" }
    } else {
      // If Response is False (e.g., no movie found for the search term)
      console.warn("OMDb API returned no results or an error:", data.Error);
      // Return an object that indicates no movies, which Movie.jsx can handle
      return { Search: [], Error: data.Error || "No movies found." };
    }
  } catch (error) {
    console.error("Error in getMoviesData:", error);
    // Re-throw the error or return a specific error object that your ErrorPage can display
    // For network errors or other unexpected issues
    throw new Response("An unexpected error occurred while fetching movie data.", { status: 500 });
  }
};

export default getMoviesData;