import React, { useEffect, useState } from "react";
import "./banner.css";
import bannerData from "./bannerdata";

const BannerHome = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  const { heading, paragraph, image } = bannerData[currentIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimate(false); // reset animation
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % bannerData.length);
        setAnimate(true); // re-trigger animation
      }, 300); // delay for fade-out effect
    }, 5000); // change every 5s

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="banner creamy-bg">
      <div className={`banner-left ${animate ? "fade-in-left" : ""}`}>
        <h2 className="text-outline-h">{heading}</h2>
        <p className="text-outline-p">{paragraph}</p>
      </div>
      <div className={`banner-right ${animate ? "fade-in-right" : ""}`}>
        <img src={image} alt="Movie Banner" className="banner-img" />
      </div>
    </div>
  );
};

export default BannerHome;
