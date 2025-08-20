import React, { useEffect, useRef, useState } from "react";
import Formpage from "../Formpage/Formpage";
import "leaflet/dist/leaflet.css";
import Maps from "../Maps/Maps";
import ProgressTracking from "../ProgressTracking/ProgressTracking";
import ItineraryGenerator from "../Itinerary/IteneraryGenerator";
import NearbyPlacesGallery from "../NearbyPlacesGallery/NearbyPlacesGallery";
import Leftcontainer from "../LeftContainer/LeftContainer";

const Dashboard = () => {
  return (
    <div
      className="h-dvh bg-[#000000] p-10 flex gap-2.5"
      style={{ alignItems: "flex-start" }}
    >
      <div>
        <div className="flex-shrink-0">
          <Leftcontainer/>
        </div>
        <div className="flex-shrink-0">
          <Formpage />
        </div>
        <div className="flex-shrink-0">
          <NearbyPlacesGallery/>
        </div>
      </div>
      <div className="flex flex-col w-full">
        <div className="flex-grow  bg-[#17161b] mt-8 p-6 rounded-lg shadow-md border border-gray-700">
          <Maps />
        </div>
        {/* <div className=" bg-[#17161b] mt-8 p-6 rounded-lg shadow-md border border-gray-700 flex justify-evenly">
        <ProgressTracking/>
        <div className="ml-4"> Hello World</div>

        </div> */}
        <div className="bg-[#17161b] mt-8 p-6 rounded-lg shadow-md border border-gray-700 flex ">
          <div className="flex ml-10">
            <ProgressTracking />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <ItineraryGenerator />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
