// Explore.jsx
import React, { useEffect, useState } from "react";
import SearchBar from "../components/Searchbar";
import PersonCard from "../components/PersonCard";

const Explore = () => {
  const [connections, setConnections] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState([]);


  const handleAddConnection = (id) =>
    setConnections((prev) => new Set([...prev, id]));
  const handleRemoveConnection = (id) =>
    setConnections((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });

  useEffect(() => {
    const fetchUsers = async () => {
      if (!searchTerm) {
        return setSearchResult([]);
      }

      try {
        const res = await fetch(`/users/search?q=${searchTerm}`, {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const data = await res.json();
        setSearchResult(data);
      } catch (error) {
        console.error("error fetching users:", error);
        setSearchResult([]);
      }
    };
    fetchUsers();
  }, [searchTerm]);

  const discoverPeople = searchResult.filter(
    (person) =>
      !connections.has(person._id) &&
      person.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const connectedPeople = searchResult.filter(
    (person) =>
      connections.has(person._id) &&
      person.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="min-h-screen  p-6"
      style={{
        backgroundImage:
          "radial-gradient(circle, #043317, #072b15, #092412, #081c0f, #05150a, #071004, #070a01, #030300, #030200, #030100, #020000, #000000)",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-green-400 mb-8">
          Explore People
        </h1>
        <SearchBar
          placeholder="Search for people..."
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        {discoverPeople.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-12">
            {discoverPeople.map((p) => (
              <PersonCard
                key={p.id}
                person={p}
                isConnected={false}
                handleAddConnection={handleAddConnection}
                handleRemoveConnection={handleRemoveConnection}
              />
            ))}
          </div>
        )}

        {connectedPeople.length > 0 && (
          <>
            <h2 className="text-2xl font-semibold text-green-400 mb-6">
              Your Connections
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {connectedPeople.map((p) => (
                <PersonCard
                  key={p.id}
                  person={p}
                  isConnected={true}
                  handleAddConnection={handleAddConnection}
                  handleRemoveConnection={handleRemoveConnection}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Explore;
