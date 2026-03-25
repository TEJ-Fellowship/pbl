import { Routes, Route } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Favorites from "./pages/Favorites";
import MyShelf from "./pages/MyShelf";

const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/favorites" element={<Favorites />} />
      </Route>
      <Route path="/auth" element={<Auth />} />
      <Route path="/my-shelf" element={<MyShelf />} />
    </Routes>
  );
};

export default App;
