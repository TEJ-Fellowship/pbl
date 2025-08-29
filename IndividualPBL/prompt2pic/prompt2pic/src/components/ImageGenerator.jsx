import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Download, Edit, Save, Image as ImageIcon, Sparkles, Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import Button from './ui/Button';
import AspectRatioSelector from './AspectRatioSelector';
import { saveAs } from 'file-saver';

const ImageGenerator = forwardRef(({ scene, prompt: initialPrompt }, ref) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [editing, setEditing] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [aspectRatio, setAspectRatio] = useState("1080x1920");

  const generateImage = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setImageUrl("");

    try {
      // ✅ Call API directly instead of SDK (avoids baseURL override bug)
      const response = await fetch("https://api.a4f.co/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_A4F_API_KEY}`,
        },
        body: JSON.stringify({
          model: "provider-1/FLUX.1.1-pro",
          prompt,
          size: aspectRatio,
          n: 1,
          response_format: "url",
        }),
      });

      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();

      const url = data.data[0].url;
      setImageUrl(url);
    } catch (error) {
      console.error("Error generating image:", error);
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

  return (
    <Card className="group hover:shadow-lg transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg mr-3">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            Scene {scene}
          </div>
          {imageUrl && (
            <div className="flex items-center text-green-600">
              <Eye className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">Ready</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <AspectRatioSelector 
          selectedRatio={aspectRatio}
          onRatioChange={setAspectRatio}
        />

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Prompt
          </label>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              readOnly={!editing}
              className={`w-full h-24 p-4 rounded-xl border-2 resize-none transition-all duration-200 ${
                editing 
                  ? "border-blue-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  : "border-gray-200 bg-gray-50 text-gray-700"
              }`}
              placeholder="Describe the scene you want to generate..."
            />
            {!editing && (
              <div
                className="absolute inset-0 cursor-pointer"
                onClick={() => setEditing(true)}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => setEditing(!editing)}
            variant="secondary"
            className="flex-1"
          >
            {editing ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
            {editing ? "Save Changes" : "Edit Prompt"}
          </Button>

          <Button
            onClick={generateImage}
            loading={loading}
            variant="default"
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {loading ? "Creating..." : "Generate Image"}
          </Button>

          {imageUrl && (
            <Button
              onClick={downloadImage}
              variant="success"
              size="default"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
        </div>

        {imageUrl && (
          <div className="relative group/image">
            <div className="relative overflow-hidden rounded-xl">
              <img
                src={imageUrl}
                alt={`Scene ${scene}`}
                className="w-full rounded-xl transition-transform duration-300 group-hover/image:scale-105"
                id={`scene-img-${scene}`}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-300 rounded-xl" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ImageGenerator.displayName = "ImageGenerator";
export default ImageGenerator;
