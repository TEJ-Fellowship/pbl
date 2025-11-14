const express = require("express");
const router = express.Router();
const moviesController = require("../controllers/moviesController");

// Movie routes
// Specific routes must come before parameterized routes to avoid conflicts
router.get("/search", moviesController.searchMovies);
router.get("/", moviesController.getAllMovies);
router.get("/:id", moviesController.getMovieById);
router.post("/", moviesController.createMovie);
router.put("/:id", moviesController.updateMovie);
router.delete("/:id", moviesController.deleteMovie);

module.exports = router;
