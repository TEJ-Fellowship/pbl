import React, { useEffect, useState } from "react";
import SearchBar from "../components/Searchbar";
import PersonCard from "../components/PersonCard";

const Explore = () => {
  const [connections, setConnections] = useState(new Set());
  const [connectedUsers, setConnectedUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState([]);

  const handleAddConnection = async (contactId) => {
    try {
      const res = await fetch("http://localhost:5000/api/contacts/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ contactId }),
      });
      console.log(contactId)
      const data = await res.json();
      console.log("this is a data",data);
      
      if (res.ok) {
        setConnections((prev) => new Set([...prev, contactId]));
      } else {
        console.error("failed to add contact", data.error);
      }
    } catch (error) {
      console.error("error adding contact", error);
    }
  };

const handleRemoveConnection = async (contactRelationId, userId) => {
  try {
    const res = await fetch(`http://localhost:5000/api/contact/remove/${contactRelationId}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await res.json();

    if (res.ok) {
      // Remove the user's ID from connection Set
      setConnections((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });

      // Remove user from connectedUsers
      setConnectedUsers((prev) =>
        prev.filter((person) => person._id !== userId)
      );
    } else {
      console.error("Failed to remove contact:", data.error);
    }
  } catch (err) {
    console.error("Error removing contact:", err);
  }
};


useEffect(() => {
  const fetchContacts = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/contact/list", {
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok) {
        const contactIds = data.map((item) => item.contact._id);
        setConnections(new Set(contactIds));
        setConnectedUsers(data.map((item) => ({
          ...item.contact,
          contactRelationId: item._id,
        })))
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  fetchContacts();
}, [connectedUsers]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!searchTerm) {
        return setSearchResult([]);
      }

      try {
        const res = await fetch(
          `http://localhost:5000/users/search?q=${searchTerm}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        const data = await res.json();
        // console.log(data)
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
      person.username.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const connectedPeople = connectedUsers

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
              // console.log(p),
              <PersonCard
                key={p._id}
                person={p}
                isConnected={false}
                handleAddConnection={handleAddConnection}
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
                  key={p._id}
                  person={p}
                  isConnected={true}
                  handleAddConnection={handleAddConnection}
                  handleRemoveConnection={() => handleRemoveConnection(p.contactRelationId, p._id)}
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
