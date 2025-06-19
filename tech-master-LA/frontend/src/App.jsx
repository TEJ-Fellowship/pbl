import Routes from "./Routes";
import { Toaster } from "react-hot-toast";
const App = () => {
  return (
    <div>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes />
    </div>
  );
};

export default App;
