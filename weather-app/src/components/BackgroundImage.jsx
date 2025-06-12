const BackgroundImage = ({ backgroundData, bgLoading }) => {
  const defaultImage =
    "https://images.pexels.com/photos/1118873/pexels-photo-1118873.jpeg"; // A default weather-related image

  return (
    <>
      <img
        src={backgroundData?.src?.large2x || defaultImage}
        alt="Weather"
        className={`absolute inset-0 w-full h-full object-cover ${
          bgLoading ? "blur-sm" : ""
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    </>
  );
};

export default BackgroundImage;
