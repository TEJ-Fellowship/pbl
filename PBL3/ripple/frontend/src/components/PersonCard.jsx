// PersonCard.jsx
import React from 'react';

const PersonCard = ({ person, isConnected, handleAddConnection, handleRemoveConnection }) => (
  <div className="bg-gray-800 bg-opacity-10 border border-gray-700 rounded-lg p-8 flex flex-col">
    <div className="flex items-center mb-4">
      <div className="w-12 h-12 rounded-full bg-green-500/50 flex items-center justify-center text-white font-semibold mr-3">
        {person.username[0].toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="flex items-center">
          <h3 className="text-white font-medium">{person.username}</h3>
          <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
        </div>
      </div>
    </div>
    
    <div className="flex gap-2 mt-auto">
      {isConnected ? (
        <button
          onClick={() => handleRemoveConnection(person._id)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
        >
          Remove
        </button>
      ) : (
        <button
          onClick={() => handleAddConnection(person._id)}
          className="flex-1 bg-green-600  hover:bg-green-600 text-white py-2 px-4 rounded-md font-medium transition-colors"
        >
          Add
        </button>
      )}
    </div>
  </div>
);

export default PersonCard;
