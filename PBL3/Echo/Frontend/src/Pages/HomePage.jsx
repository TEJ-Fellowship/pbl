import Recorder from "../Components/Recorder";
import Feed from "../Components/Feed";
const HomePage = () => {
  return (
    <div className="max-w-2xl mx-auto mt-8">
      <Recorder />
      <Feed />
      {/* Later we’ll add Feed here */}
    </div>
  );
};

export default HomePage;
