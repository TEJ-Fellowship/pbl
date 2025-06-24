import React from "react";
// import './ResumePreview.css';

const ResumePreview = ({ extractedText, fileName, onClose }) => {
  return (
    <div onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <div>
          <h3>Resume Preview - {fileName}</h3>
          <button onClick={onClose}>×</button>
        </div>

        <div>
          <div>
            <h4>Extracted Text:</h4>
            <div>{extractedText || "No text extracted"}</div>
          </div>

          <div>
            <div>
              <strong>Characters:</strong> {extractedText?.length || 0}
            </div>
            <div>
              <strong>Words:</strong>{" "}
              {extractedText?.split(/\s+/).filter((word) => word.length > 0)
                .length || 0}
            </div>
            <div>
              <strong>Lines:</strong> {extractedText?.split("\n").length || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;
