import React from 'react';

const HomePage = () => {
  // Replace 'your_cloud_name' with your actual Cloudinary cloud name
  const cloudName = "ddfvqm9wq";
  const uploadPreset = "glimpse"; // Create an unsigned upload preset in your Cloudinary dashboard

  const openCloudinaryWidget = () => {
    const myWidget = window.cloudinary.openUploadWidget(
      {
        cloudName: cloudName,
        uploadPreset: uploadPreset,
        sources: ['local', 'url', 'camera'], // Specify allowed upload sources
        resourceType: 'video', // Only allow video uploads
        clientAllowedFormats: ["mp4", "webm", "mov"],
        maxFileSize: 20000000, // Optional: Maximum file size in bytes (e.g., 20MB)
        folder: "glimpses", // Optional: Store uploads in a specific folder
        cropping: false, // Optional: Disable cropping if not needed
        multiple: false, // Ensure only a single file can be uploaded at a time
        // You can add more options here based on your needs
        // See the full list of options: https://cloudinary.com/documentation/upload_widget_reference
      },
      (error, result) => {
        if (!error && result && result.event === "success") {
          console.log('Done! Here is the video info: ', result.info);
          const videoUrl = result.info.secure_url;
          
          // Here, you would typically handle the uploaded video URL:
          // 1. Send it to your backend API to save the glimpse
          // 2. Update a React state to show the uploaded video to the user
          // 3. Display a success message
          
          alert(`Glimpse uploaded successfully! URL: ${videoUrl}`);
        } else if (result.event === "abort") {
          console.log("Upload aborted.");
        } else if (error) {
          console.error("Upload error:", error);
        }
      }
    );

    // Call this method to open the widget
    myWidget.open();
  };

  return (
    <div className="mb-12 text-center relative z-20 px-4">
      <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-tight text-shadow drop-shadow-2xl">
        Capture a single second,
        <br />
        relive a lifetime of memories.
      </h2>
      <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed text-shadow drop-shadow-lg">
        Glimpse is built on one simple idea: the micro video is the default unit of memory. 
        By capturing just one second of your day, every day, you create an emotional highlight reel that is short, bingeable, and deeply personal. 
        Over time, your collection of glimpses becomes the most authentic and memorable way to look back on your life.
      </p>
      
      <button 
        onClick={openCloudinaryWidget} // Add the onClick handler here
        className="px-8 py-4 bg-white text-[--glimpse-dark-blue] font-bold rounded-full shadow-lg hover:shadow-xl transition-transform transform hover:scale-105 active:scale-95 duration-200 focus:outline-none focus:ring-2 focus:ring-[--glimpse-dark-blue] focus:ring-offset-2 focus:ring-offset-gray-50"
      >
        Upload Today's Glimpse
      </button>
    </div>
  );
};

export default HomePage;