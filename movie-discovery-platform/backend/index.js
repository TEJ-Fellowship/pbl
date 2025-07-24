const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const OMDB_API_KEY = process.env.OMDB_API_KEY;

app.use(cors()); // allow frontend to connect
app.use(express.json());

// Route to fetch movies from OMDb
app.get('/api/search', async (req, res) => {
  const { query } = req.query;

// let query = "Inception";

  if (!query) return res.status(400).json({ error: 'Query is required' });

  try {
    const response = await axios.get(`http://www.omdbapi.com/?s=${query}&apikey=${OMDB_API_KEY}`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch movie data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
