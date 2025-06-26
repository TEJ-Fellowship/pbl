import Routes from "./Routes";

function App() {
  return (
    // This replaces the html, body, #root styles
    <div className="h-full w-full m-0 p-0 box-border overflow-x-hidden">
      {/* This replaces the app-big-container class */}
      <Routes />
    </div>
  );
}

export default App;
