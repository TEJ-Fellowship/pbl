import React, { useState, useEffect } from 'react';
import ReactFlagsSelect from "react-flags-select";


import '../css/Navbar.css';
import logo_light from '../assets/logo-v1.png';
import logo_dark from '../assets/logo-v2.png';
import search_icon_light from '../assets/white.png';
import search_icon_dark from '../assets/black.png';
import toggle_light from '../assets/night.png';
import toggle_dark from '../assets/day.png';
import set_icon_light from '../assets/set_wb.png';
import set_icon_dark from '../assets/set_bb.png';

function Navbar({searchTerm,setSearchTerm}) {
  const [darkMode, setDarkMode] = useState(false);
  const [setShow, setShowHandle] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('np');

  useEffect(() => {
    document.querySelector('.container')?.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  const handleSettings = () => {
    setShowHandle(prev => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (setShow && !event.target.closest('.settings-container') && 
          !event.target.closest('.country-list')) {
        setShowHandle(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setShow]);

  return (
    <>
      <div className={`navbar ${darkMode ? 'dark' : ''}`}>
        <img src={darkMode ? logo_light : logo_dark} alt="Hamro Calendar" className='logo' />
        
        <div className='search-box'>
          <input
      type='text'
      placeholder='Search events...'
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
          <img src={darkMode ? search_icon_dark : search_icon_light} alt="Search" />
        </div>
        
        <div className='setting-icons'>
          <div className="settings-container">
            <img 
              src={darkMode ? set_icon_light : set_icon_dark} 
              alt='Settings' 
              className='set-icon' 
              onClick={handleSettings} 
            />
            {setShow && (
              <div className={`settings-dropdown ${darkMode ? 'dark' : ''}`}>
                <ul>
                  <p id='set'>Settings</p><hr />
                  <li>
                    <span id="country-li">Country
                      <ReactFlagsSelect selected={selectedCountry}
                        onSelect={(code) => setSelectedCountry(code)}
                        id="flags-select"
                      />
                    </span>
                  </li>
                  <li>Profile</li>
                  <li>Theme</li>
                </ul>
              </div>
            )}
          </div>

          <img 
            src={darkMode ? toggle_dark : toggle_light} 
            alt='Toggle theme' 
            className='toggle-icon' 
            onClick={toggleDarkMode} 
          />
        </div>
      </div>
    </>
  );
}

export default Navbar;
