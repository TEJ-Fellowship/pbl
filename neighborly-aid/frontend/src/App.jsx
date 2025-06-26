import Routes from "./Routes";

function App() {
  return (
    // This replaces the html, body, #root styles
    <div className="h-full w-full m-0 p-0 box-border overflow-x-hidden">
      {/* This replaces the app-big-container class */}
      <div className="min-h-screen w-[60vw] mx-auto mt-4 p-[50px] bg-background-light dark:bg-background-middleDark rounded-2xl shadow-custom transition-colors duration-200">
        <Routes />
      </div>
    </div>
  );
}

export default App;