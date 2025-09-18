import { useNavigate } from "react-router-dom";
import axios from "axios";

function ActionButton() {
  const navigate = useNavigate();

  const handleClick = () => {
    const token = localStorage.getItem("authToken"); // or however you store login state

    if (!token) {
      // Not logged in → send to login
      navigate("/login");
    } else {
        const cloudName = "ddfvqm9wq";
        const uploadPreset = "glimpse";

        // const openCloudinaryWidget = () => {
            const myWidget = window.cloudinary.openUploadWidget(
            {
                cloudName: cloudName,
                uploadPreset: uploadPreset,
                sources: ["local", "camera"],
                resourceType: "video",
                clientAllowedFormats: ["mp4", "webm", "mov"],
                maxFileSize: 20000000,
                folder: "glimpses",
                cropping: false,
                multiple: false,
                transformation: [
                { start_offset: "0", end_offset: "1" }, // 🔥 trim to 1 second
                ],
            },
            async (error, result) => {
                if (!error && result && result.event === "success") {
                console.log("Video uploaded: ", result.info);

                const videoUrl = result.info.secure_url;
                const publicId = result.info.public_id;

                try {
                    await axios.post("http://localhost:3001/api/clips", {
                    videoUrl,
                    publicId,
                    });
                } catch (err) {
                    console.error("Backend error:", err);
                    alert("❌ Failed to save glimpse. Check backend logs.");
                }
                } else if (result.event === "abort") {
                console.log("Upload aborted.");
                } else if (error) {
                console.error("Upload error:", error);
                }
            }
            );

            myWidget.open();
        // };

    }
  };

  return <button onClick={handleClick} className="px-8 py-4 bg-black text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-transform transform hover:scale-105 active:scale-95 duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 focus:ring-offset-gray-50">Upload Today's Glimpse</button>;
}

export default ActionButton;
