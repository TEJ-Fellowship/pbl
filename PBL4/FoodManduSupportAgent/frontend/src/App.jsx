import React, { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/health")
      .then(res => res.json())
      .then(data => setStatus(data.status))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>🍔 Foodmandu Support Agent</h1>
      <p>Backend status: {status}</p>
    </div>
  );
}

export default App;
