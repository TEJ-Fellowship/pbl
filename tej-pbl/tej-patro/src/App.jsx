import { useState } from "react";
import Calendar from "./components/Calendar.jsx";
import Login from "./components/login.jsx";

function App() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="App">
      {showLogin ? (
        <Login onBack={() => setShowLogin(false)} />
      ) : (
        <Calendar onLoginClick={() => setShowLogin(true)} />
      )}
    </div>
  );
}

export default App;
