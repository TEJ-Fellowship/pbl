import React, { useState } from 'react';
import { Search } from 'lucide-react';

const Explore = () => {
  const [connections, setConnections] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const allPeople = [
    { id: 1, name: 'Alice Johnson', initials: 'AJ' },
    { id: 2, name: 'Bob Smith', initials: 'BS' },
    { id: 3, name: 'Carol Davis', initials: 'CD' },
    { id: 4, name: 'David Wilson', initials: 'DW' },
    { id: 5, name: 'Emma Brown',  initials: 'EB' },
    { id: 6, name: 'Frank Miller', initials: 'FM' },
    { id: 7, name: 'Grace Lee', initials: 'GL' },
    { id: 8, name: 'Henry Taylor', initials: 'HT' },
    { id: 9, name: 'Ivy Chen', initials: 'IC' },
    { id: 10, name: 'Jack Anderson', initials: 'JA' },
  ];

  const handleAddConnection = (personId) => {
    setConnections(prev => new Set([...prev, personId]));
  };

  const handleRemoveConnection = (personId) => {
    setConnections(prev => {
      const newConnections = new Set(prev);
      newConnections.delete(personId);
      return newConnections;
    });
  };

  const discoverPeople = allPeople.filter(person => !connections.has(person.id));
  const connectedPeople = allPeople.filter(person => connections.has(person.id));

  const PersonCard = ({ person, isConnected }) => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 flex flex-col">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold mr-3">
          {person.initials}
        </div>
        <div className="flex-1">
          <div className="flex items-center">
            <h3 className="text-white font-medium">{person.name}</h3>
            <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 mt-auto">
        {isConnected ? (
          <button
            onClick={() => handleRemoveConnection(person.id)}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
          >
            Remove
          </button>
        ) : (
          <button
            onClick={() => handleAddConnection(person.id)}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md font-medium transition-colors"
          >
            Add
          </button>
        )}
      </div>
    </div>
  );

  const SearchBar = ({ placeholder }) => (
    <div className="relative mb-8">
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full bg-gray-800 border border-gray-600 rounded-lg py-3 px-4 pr-12 text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
      />
      <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-green-400 mb-8">Explore People</h1>
        
        <SearchBar placeholder="Search for people..." />

        {discoverPeople.length > 0 && (
          <>
            <h2 className="text-2xl font-semibold text-green-400 mb-6">Discover People</h2>
            <div className="grid grid-cols-3 gap-4 mb-12">
              {discoverPeople.map(person => (
                <PersonCard key={person.id} person={person} isConnected={false} />
              ))}
            </div>
          </>
        )}


        {connectedPeople.length > 0 && (
          <>
            <h2 className="text-2xl font-semibold text-green-400 mb-6">Your Connections</h2>
            <div className="grid grid-cols-3 gap-4">
              {connectedPeople.map(person => (
                <PersonCard key={person.id} person={person} isConnected={true} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Explore;