import React, { useRef, useState } from "react";
import { LuUser, LuUpload, LuTrash } from "react-icons/lu";

const ProfilePhotoSelector = ({ image, setImage }) => {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  console.log("ProfilePhotoSelector render");
  console.log("image prop:", image);
  console.log("previewUrl state before logic:", previewUrl);

  // Manual logic to update previewUrl on every render without useEffect
  // Only update if previewUrl is null or if image changed (simple check)
  if (image && !previewUrl) {
    if (typeof image === "string") {
      console.log("image is a string URL, setting previewUrl");
      setPreviewUrl(image);
    } else if (image instanceof File) {
      const preview = URL.createObjectURL(image);
      console.log("image is a File, creating preview URL:", preview);
      setPreviewUrl(preview);
    }
  }

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log("File selected:", file);
      setImage(file);
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      console.log("Preview URL set:", preview);
    }
  };

  const handleRemoveImage = () => {
    console.log("Removing image");
    setImage(null);
    setPreviewUrl(null);
  };

  const onChooseFile = () => {
    inputRef.current?.click();
  };

  console.log("previewUrl state after logic:", previewUrl);

  return (
    <div className="flex justify-center mb-6">
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        onChange={handleImageChange}
        className="hidden"
      />

      {!image ? (
        <div className="w-20 h-20 flex items-center justify-center bg-purple-200 rounded-full relative">
          <LuUser className="text-4xl text-primary" />

          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full absolute -bottom-1 -right-1"
            onClick={onChooseFile}
          >
            <LuUpload />
          </button>
        </div>
      ) : (
        <div className="relative">
          <img
            src={previewUrl}
            alt="profile photo"
            className="w-20 h-20 rounded-full object-cover"
          />
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full absolute -bottom-1 -right-1"
            onClick={handleRemoveImage}
          >
            <LuTrash />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfilePhotoSelector;
