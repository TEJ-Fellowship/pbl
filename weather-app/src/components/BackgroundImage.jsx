import Spinner from "./Spinner";

const BackgroundImage = ({ backgroundData, loading }) => {
  const defaultImage =
    "https://images.pexels.com/photos/1118873/pexels-photo-1118873.jpeg"; // A default weather-related image

  return (
    <>
      {loading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <Spinner />
        </div>
      ) : (
        <img
          src={backgroundData?.src?.large2x || defaultImage}
          alt="Weather"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    </>
  );
};

export default BackgroundImage;
