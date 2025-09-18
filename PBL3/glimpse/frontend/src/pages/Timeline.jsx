import { useEffect, useState } from 'react';
import TIMELINE_DATA from '../components/TimelineData';
import VideoModal from '../components/VideoModel';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
const Timeline = () => {
  const [clips, setClips] = useState(TIMELINE_DATA)
    const navigate = useNavigate();
  useEffect(()=> {
    axios.get('http://localhost:3001/api/clips').then((response) => {
      setClips(clips.concat(response.data))
    })

  }, [])
  console.log(clips)
  const [selectedVideo, setSelectedVideo] = useState(null);
  const sortedData = [...clips].sort((a, b) => new Date(b.date) - new Date(a.date));
  console.log(sortedData)
  const groupedData = sortedData.reduce((acc, glimpse) => {
    const date = new Date(glimpse.date);
    const monthYearKey = date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    if (!acc[monthYearKey]) {
      acc[monthYearKey] = [];
    }
    acc[monthYearKey].push(glimpse);
    return acc;
  }, {});
  const sortedMonthYearKeys = Object.keys(groupedData);

  return (
    <div className="p-4 md:p-8 w-full mx-auto">
      {sortedMonthYearKeys.map((monthYearKey) => (
        <div key={monthYearKey}>
          <h3 className="py-2 text-xl font-semibold text-gray-600 flex gap-3">
            <ArrowLeft onClick={()=>navigate('/')} className='cursor-pointer' /> {monthYearKey}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-4">
            {groupedData[monthYearKey].map((glimpse) => (
              <div
                key={glimpse.id}
                onClick={() => setSelectedVideo(glimpse.videoUrl)}
                className={`relative overflow-hidden aspect-[3/4] rounded-xl shadow-lg group transition-all duration-300 transform-gpu cursor-pointer ${
                  glimpse.isToday
                    ? "border-4 border-[--glimpse-accent] ring-4 ring-white ring-opacity-50"
                    : ""
                } hover:scale-105 hover:shadow-2xl`}
                style={{
                  // backgroundImage: `url(https://picsum.photos/400?random=${glimpse.id})`,
                  
                  backgroundImage: `url(${(glimpse.thumbnailUrl)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-end items-center p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
                  <p className="font-bold text-sm md:text-base">
                    {glimpse.date}
                    {console.log('thubnailurlx', glimpse.thumbnailUrl)}
                  </p>
                  <p className="text-xs md:text-sm mt-1 italic leading-tight">
                    {glimpse.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {selectedVideo && (
        <VideoModal
          videoUrl={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
};

export default Timeline;