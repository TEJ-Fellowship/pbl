import React, { useState, useEffect } from "react";
import realstate from "../../assets/realstate.jpg";
import realstate1 from "../../assets/realstate1.jpg";
import realstate2 from "../../assets/realstate2.jpg";
import realstate3 from "../../assets/realstate3.jpg";
import realstate4 from "../../assets/realstate4.jpg";
import realstate5 from "../../assets/realstate5.jpg";
import realstate6 from "../../assets/realstate6.jpg";
import realstate7 from "../../assets/realstate7.jpg";
import Search from "../Search/Search";
import Navbar from "../Navbar/Navbar";
import {
  Bath,
  Bed,
  Facebook,
  Github,
  Instagram,
  Square,
  Twitter,
} from "lucide-react";

const Landing = () => {
  const images = [
    realstate,
    realstate1,
    realstate2,
    realstate3,
    realstate4,
    realstate5,
    realstate6,
    realstate7,
  ];



  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prevIndex) => (prevIndex + 1) % images.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const featuredProperties = [
    {
      id: 1,
      title: "Cozy Apartment in Downtown",
      beds: 2,
      baths: 2,
      sqft: 1200,
      image: realstate,
    },
    {
      id: 2,
      title: "Spacious Family Home in Suburbia",
      beds: 4,
      baths: 3,
      sqft: 1800,
      image: realstate1,
    },
    {
      id: 3,
      title: "Luxury Condo with City Views",
      beds: 3,
      baths: 3,
      sqft: 1800,
      image: realstate2,
    },
    {
      id: 4,
      title: "Charming Cottage in the Countryside",
      beds: 3,
      baths: 2,
      sqft: 1500,
      image: realstate3,
    },
    {
      id: 5,
      title: "Modern Townhouse with Private Garden",
      beds: 3,
      baths: 2.5,
      sqft: 1600,
      image: realstate4,
    },
    {
      id: 6,
      title: "Renovated Historic House",
      beds: 4,
      baths: 3,
      sqft: 2800,
      image: realstate5,
    },
    {
      id: 7,
      title: "Renovated Historic House",
      beds: 4,
      baths: 3,
      sqft: 2900,
      image: realstate6,
    },
  ];


      
  return (
    <>
      <div className="relative">
        <div className="relative w-full max-w-7xl mt-10 mx-auto pt-[2rem] pb-[10rem] px-[10rem]">
          <div
            className="absolute inset-0 rounded-xl bg-cover bg-center transition-all duration-1000 ease-in-out"
            style={{ backgroundImage: `url(${images[currentImage]})` }}
          >
            <div className="absolute inset-0 bg-black opacity-30 hover:opacity-50 transition-opacity duration-300"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center text-white text-center">
            <div className>
              <h1 className="text-4xl font-bold mt-44">Find Your Dream Home</h1>
              <p className="text-lg mb-6">
                Explore a wide range of properties for sale and rent. Your
                perfect home is just a search away!
              </p>
              <div className="relative flex justify-center w-full max-w-[600px] mx-auto">
                <Search />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="mx-auto max-w-2xl px-[10rem] py-[1.25rem] sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              Featured Properties
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-2">
              {featuredProperties.map((property) => (
                <div
                  key={property.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="h-48 bg-gray-200 overflow-hidden">
                    <img
                      src={property.image}
                      alt={property.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      {property.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Bed className="h-4 w-4" />
                        <span className="text-sm">{property.beds}Beds</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Bath className="h-4 w-4" />
                        <span className="text-sm">{property.baths}Baths</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Square className="h-4 w-4" />
                        <span className="text-sm">
                          {property.sqft.toLocaleString()}sq ft
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div>
        <section className="bg-white">
          <div className="max-w-screen-xl px-4 py-9 mx-auto space-y-7 overflow-hidden sm:px-6 lg:px-8">
            <footer className="flex flex-wrap justify-center -mx-5 -my-2">
              <div className="px-5 py-2">
                <a
                  href="#"
                  className="text-base leading-6 text-gray-500 hover:text-gray-900"
                >
                  About
                </a>
              </div>
              <div className="px-5 py-2">
                <a
                  href="#"
                  className="text-base leading-6 text-gray-500 hover:text-gray-900"
                >
                  Privacy Policy
                </a>
              </div>
              <div className="px-5 py-2">
                <a
                  href="#"
                  className="text-base leading-6 text-gray-500 hover:text-gray-900"
                >
                  Terms
                </a>
              </div>
              <div className="px-5 py-2">
                <a
                  href="#"
                  className="text-base leading-6 text-gray-500 hover:text-gray-900"
                >
                  Contact
                </a>
              </div>
            </footer>
            <div className="flex justify-center mt-4 space-x-6">
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <span className="sr-only">Facebook</span>
                <Facebook />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <span className="sr-only">Instagram</span>
                <Instagram />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <span className="sr-only">Twitter</span>
                <Twitter />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <span className="sr-only">GitHub</span>
                <Github />
              </a>
            </div>
            <p className="mt-5 text-base leading-2 text-center text-gray-700">
              © 2025 MeroGhar, Inc. All rights reserved.
            </p>
          </div>
        </section>
      </div>
    </>
  );
};

export default Landing;
