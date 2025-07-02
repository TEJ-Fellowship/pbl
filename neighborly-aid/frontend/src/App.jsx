import Routes from "./Routes";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <div className="h-full w-full m-0 p-0 box-border overflow-x-hidden">
      <Routes />
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
