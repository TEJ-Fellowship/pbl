import { useState, useEffect } from "react";

export const useFriends = (currentUserId) => {
  const [friendsList, setFriendsList] = useState([]);

  useEffect(() => {
    async function fetchFriends() {
      try {
        const res = await fetch("http://localhost:5000/api/contact/list", {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        setFriendsList(data.map((f) => f._id)); // store _id for reliability
      } catch (err) {
        console.error("Failed to fetch friends:", err);
      }
    }
    fetchFriends();
  }, [currentUserId]);

  const isFriend = (userId) => friendsList.includes(userId);

  return { isFriend };
};
