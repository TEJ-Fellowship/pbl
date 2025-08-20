import { useState, forwardRef, useImperativeHandle } from "react";
import OpenAI from "openai";
import { saveAs } from "file-saver";

const client = new OpenAI({
  apiKey: import.meta.env.VITE_A4F_API_KEY,
  baseURL: "https://api.adf.co/v1",   // ✅ match Python base_url
  dangerouslyAllowBrowser: true,
});

const ImageGenerator = forwardRef(({ scene, prompt: initialPrompt }, ref) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [editing, setEditing] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const generateImage = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setImageUrl("");
    try {
      const img = await client.images.generate({
        model: "provider-5/imagen-3.0-generate-002",  // ✅ match Python model
        prompt,
        size: "1024x1024",  // ✅ safe supported size
        n: 1,
        response_format: "url",
      });

      const url = img.data[0].url;
      setImageUrl(url);
    } catch (error) {
      console.error("Error generating image:", error);
      alert(`Image generation failed: ${error.message}`); // better debug
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    generateImage,
  }));

  const downloadImage = async () => {
    if (!imageUrl) return;
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    saveAs(blob, `scene${scene}.png`);
  };

  const handleEditSave = () => {
    setEditing(!editing);
  };

  return (
    <div className="scene-card">
      <h3>Scene {scene}</h3>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        readOnly={!editing}
        className="scene-textarea"
      />

      <div className="scene-actions">
        <button onClick={handleEditSave} className="scene-btn">
          {editing ? "Save" : "Edit"}
        </button>

        <button
          onClick={generateImage}
          disabled={loading}
          className="scene-btn"
        >
          {loading ? "Generating..." : "Generate Image"}
        </button>

        {imageUrl && (
          <button onClick={downloadImage} className="scene-btn secondary">
            Download
          </button>
        )}
      </div>

      {imageUrl && (
        <img
          src={imageUrl}
          alt={`Scene ${scene}`}
          className="scene-image"
          id={`scene-img-${scene}`}
        />
      )}
    </div>
  );
});

export default ImageGenerator;
