import React from 'react';
import { Smartphone, Monitor, Tv, Maximize } from 'lucide-react';

const AspectRatioSelector = ({ selectedRatio, onRatioChange }) => {
  const aspectRatios = [
    {
      label: 'Square',
      value: '1024x1024',
      ratio: '1:1',
      icon: <div className="w-4 h-4 bg-current rounded" />,
      description: 'Perfect for social media posts'
    },
    {
      label: 'Portrait 9:16',
      value: '1080x1920',       // width x height in pixels
      ratio: '9:16',
      icon: <Smartphone className="w-4 h-4" />,
      description: 'Perfect for TikTok, Reels, and mobile videos'
    },
    {
      label: 'Landscape',
      value: '1024x768',
      ratio: '4:3',
      icon: <Monitor className="w-4 h-4" />,
      description: 'Classic photo format'
    },
    {
      label: 'Wide',
      value: '1024x576',
      ratio: '16:9',
      icon: <Tv className="w-4 h-4" />,
      description: 'Cinematic format'
    },
    {
      label: 'Ultra Wide',
      value: '1024x439',
      ratio: '21:9',
      icon: <Maximize className="w-4 h-4" />,
      description: 'Panoramic view'
    }
  ];

  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        Aspect Ratio
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {aspectRatios.map((ratio) => (
          <button
            key={ratio.value}
            onClick={() => onRatioChange(ratio.value)}
            className={`p-3 rounded-xl border-2 transition-all duration-200 text-left group ${selectedRatio === ratio.value
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`${selectedRatio === ratio.value ? 'text-blue-600' : 'text-gray-500'}`}>
                {ratio.icon}
              </div>
              <span className={`text-xs font-medium ${selectedRatio === ratio.value ? 'text-blue-600' : 'text-gray-500'
                }`}>
                {ratio.ratio}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-900 mb-1">
              {ratio.label}
            </div>
            <div className="text-xs text-gray-500">
              {ratio.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AspectRatioSelector;