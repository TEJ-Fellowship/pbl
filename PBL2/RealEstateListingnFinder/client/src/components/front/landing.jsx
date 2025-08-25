import React, { useState, useEffect } from 'react';
import realstate from '../../assets/realstate.jpg';
import realstate1 from '../../assets/realstate1.jpg';
import realstate2 from '../../assets/realstate2.jpg';
import realstate3 from '../../assets/realstate3.jpg';
import realstate4 from '../../assets/realstate4.jpg';
import realstate5 from '../../assets/realstate5.jpg';
import realstate6 from '../../assets/realstate6.jpg';
import realstate7 from '../../assets/realstate7.jpg';
import Search from '../Search/Search'

const Landing = () => {
  const images = [realstate, realstate1, realstate2, realstate3, realstate4, realstate5, realstate6, realstate7];

  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prevIndex) => (prevIndex + 1) % images.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="relative w-full max-w-4xl h-96 mx-auto my-[40px]">
        <div
          className="absolute inset-0 rounded-xl bg-cover bg-center transition-all duration-1000 ease-in-out"
          style={{ backgroundImage: `url(${images[currentImage]})` }}
        >
          <div className="absolute inset-0 bg-black opacity-30 hover:opacity-50 transition-opacity duration-300"></div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center text-white z-10 text-center px-4">
          <div>
            <h1 className="text-4xl font-bold mt-10">Find Your Dream Home</h1>
            <p className="text-lg mb-6">
              Explore a wide range of properties for sale and rent. Your perfect home is just a search away!
            </p>
            <div className="relative flex justify-center w-full max-w-[600px] mx-auto">
                <Search /> 
            </div>
          </div>
        </div>
      </div>

      <div>hello</div>
    </>
  );
};

export default Landing;
