// src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Components
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';

// Pages
import Home from './pages/Home';
import TopRated from './pages/TopRated';
import Upcoming from './pages/Upcoming';
import Genres from './pages/Genres';
import Contact from './pages/Contact';
import PageNotFound from './pages/PageNotFound';
import MovieDetails from './pages/MovieDetails';

const App = () => {
  return (
    <React.Fragment>
      <Router>
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/top-rated" element={<TopRated />} />
          <Route path="/upcoming" element={<Upcoming />} />
          <Route path="/genres" element={<Genres />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<PageNotFound />} />
          <Route path='/movie/:id' element={<MovieDetails/>} />
        </Routes>

        <Footer />
      </Router>
    </React.Fragment>
  );
};

export default App;
