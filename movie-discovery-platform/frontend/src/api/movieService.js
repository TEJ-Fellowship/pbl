// src/api/movieService.js

const API_KEY = '66cadd0a'; // Replace this with your OMDb API key
const BASE_URL = `https://www.omdbapi.com/`;

export const fetchMovies = async (query) => {
  try {
    const response = await fetch(`${BASE_URL}?s=${query}&apikey=${API_KEY}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching movies:', error);
    return null;
  }
};
