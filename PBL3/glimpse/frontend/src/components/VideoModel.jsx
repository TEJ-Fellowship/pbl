const VideoModal = ({ videoUrl, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
    {" "}
    <div className="relative w-full max-w-xl mx-auto rounded-xl shadow-2xl overflow-hidden">
      {" "}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-50 focus:outline-none"
        aria-label="Close video"
      >
        {" "}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {" "}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />{" "}
        </svg>{" "}
      </button>{" "}
      <video
        src={videoUrl}
        controls
        autoPlay
        loop
        className="w-full h-auto"
        poster="https://picsum.photos/400"
      />{" "}
    </div>{" "}
  </div>
);
export default VideoModal