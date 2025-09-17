import React, { useState } from "react";
import Recorder from "./Recorder";
import Modal from "./Modal";

const AddConfession = ({ setClips }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [caption, setCaption] = useState("");

  return (
    <div>
      {/* Button to open modal */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg"
      >
        Add Confession
      </button>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 className="text-xl font-bold mb-4">Add Confession</h2>

        {/* Caption input */}
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Enter a caption..."
          className="w-full border px-3 py-2 rounded-lg mb-4"
        />

        {/* Recorder component (untouched except new prop) */}
        <Recorder
          setClips={setClips}
          showUpload={true}
          caption={caption}
          setCaption={setCaption}
          setUpload={setIsModalOpen}
        />
      </Modal>
    </div>
  );
};

export default AddConfession;
