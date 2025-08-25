import React, { useState } from "react";

const Create = ({ handleSubmit }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  return (
    <div className="container">
      <form onSubmit={(e) => handleSubmit(title, content, e)}>
        <input
          type="text"
          placeholder="Enter Title!"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Enter Your Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <button type="submit">Create</button>
      </form>
    </div>
  );
};

export default Create;
