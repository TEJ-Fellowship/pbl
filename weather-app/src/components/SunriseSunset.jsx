import { useState, useEffect } from 'react';

const SunriseSunset = ({ sunrise, sunset }) => {
  const [timeUntil, setTimeUntil] = useState({ target: '', hours: 0, minutes: 0, seconds: 0 });
  const [progress, setProgress] = useState(0);

  const getProgressStyle = (progress, target) => {
    // Different color schemes for sunrise and sunset with linear gradient for rectangular design
    if (target === 'sunrise') {
      return {
        background: `linear-gradient(to right, 
          #FF6B6B 0%, 
          #FFE66D 50%, 
          #FF8E53 ${progress}%, 
          rgba(255, 255, 255, 0.15) ${progress}%)`
      };
    } else {
      return {
        background: `linear-gradient(to right, 
          #667eea 0%, 
          #764ba2 50%, 
          #f093fb ${progress}%, 
          rgba(255, 255, 255, 0.15) ${progress}%)`
      };
    }
  };

  const calculateTimeUntil = () => {
    const now = new Date().getTime();
    const sunriseTime = sunrise * 1000; // Convert to milliseconds
    const sunsetTime = sunset * 1000;

    // Determine if we're counting to sunrise or sunset
    let target, timeLeft;
    if (now < sunriseTime) {
      target = 'sunrise';
      timeLeft = sunriseTime - now;
    } else if (now < sunsetTime) {
      target = 'sunset';
      timeLeft = sunsetTime - now;
    } else {
      // After sunset, count to next day's sunrise
      target = 'sunrise';
      timeLeft = (sunriseTime + 86400000) - now; // Add 24 hours in milliseconds
    }

    // Calculate hours, minutes, and seconds
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    // Calculate progress percentage
    const totalDuration = target === 'sunrise' 
      ? sunriseTime - (sunsetTime - 86400000) // Previous sunset to sunrise
      : sunsetTime - sunriseTime; // Sunrise to sunset
    const elapsed = target === 'sunrise'
      ? now - (sunsetTime - 86400000)
      : now - sunriseTime;
    const newProgress = (elapsed / totalDuration) * 100;

    setTimeUntil({ target, hours, minutes, seconds });
    setProgress(newProgress);
  };

  useEffect(() => {
    calculateTimeUntil();
    const interval = setInterval(calculateTimeUntil, 1000); // Update every second
    return () => clearInterval(interval);
  }, [sunrise, sunset]);
  
  return (
    <div className="relative w-24 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20" 
    style={getProgressStyle(progress, timeUntil.target)}
    >
      {/* Progress indicator bar */}
      <div 
        className="absolute top-0 left-0 h-1 rounded-full transition-all duration-300"
       
      />
      
      {/* Content */}
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-white leading-none">
          <span className="block text-sm font-bold">{`${timeUntil.hours}h ${timeUntil.minutes}m ${timeUntil.seconds}s`}</span>
          <span className="text-[12px] opacity-80">until {timeUntil.target}</span>
        </div>
      </div>
    </div>
  );
};

export default SunriseSunset;
