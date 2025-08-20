import React, { useState, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Download, Sparkles, Zap, Wand2, ImageIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import CharacterManager from '../components/CharacterManager';
import ImageGenerator from '../components/ImageGenerator';
import VoiceToText from '../components/VoiceToText';
import JSZip from "jszip";
import { saveAs } from "file-saver";
import logo from "../assets/logo.png";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export default function HomePage() {
  const [characters, setCharacters] = useState([{ id: 'c1', description: '' }]);
  const [topic, setTopic] = useState("");
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);

  const imageRefs = useRef({});

  const handleVoiceTranscript = (transcript) => {
    setTopic(transcript);
  };

  const replaceCharacterReferences = (text) => {
    let processedText = text;
    characters.forEach(char => {
      if (char.description.trim()) {
        const regex = new RegExp(`\\b${char.id}\\b`, 'gi');
        processedText = processedText.replace(regex, char.description);
      }
    });
    return processedText;
  };

  const handleGeneratePrompts = async () => {
    setLoading(true);
    setPrompts([]);
    
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const characterList = characters
        .filter(char => char.description.trim())
        .map(char => `${char.id}: ${char.description}`)
        .join('\n');

      const processedTopic = replaceCharacterReferences(topic);

      const promptText = `
You are an expert AI image prompt generator specializing in creating detailed, artistic prompts.

Character definitions:
${characterList}

Based on the user input:
"""${processedTopic}"""

Create exactly 5 detailed AI image prompts. Each prompt should be highly descriptive and optimized for image generation.
If character references (c1, c2, etc.) appear in the input, use their full descriptions from the character definitions.

Output a JSON array of 5 objects:
Keys: "scene" (1-5), "prompt" (detailed artistic prompt string for AI image generation)

Make each prompt include:
- Detailed visual descriptions
- Lighting and atmosphere
- Composition and camera angle
- Art style or mood
- High-quality rendering keywords

Example format: "detailed portrait of [character description], [setting], [lighting], [mood], [style], highly detailed, 8k resolution, masterpiece"
`;

      const generationResult = await model.generateContent(promptText);
      const rawResponse = await generationResult.response.text();
      const parsed = JSON.parse(rawResponse);
      setPrompts(parsed);
    } catch (error) {
      console.error("Error generating prompts:", error);
      setPrompts([{ scene: 1, prompt: "Error: Failed to generate prompts. " + error.message }]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAllImages = async () => {
    setGeneratingAll(true);
    const refsArray = Object.values(imageRefs.current);

    for (let i = 0; i < refsArray.length; i++) {
      const ref = refsArray[i];
      if (ref && ref.generateImage) {
        await ref.generateImage();
        if (i < refsArray.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    }
    setGeneratingAll(false);
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    for (const { scene } of prompts) {
      const imgElement = document.querySelector(`#scene-img-${scene}`);
      if (imgElement) {
        try {
          const response = await fetch(imgElement.src);
          const blob = await response.blob();
          zip.file(`scene${scene}.png`, blob);
        } catch (error) {
          console.error(`Error downloading scene ${scene}:`, error);
        }
      }
    }
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "allscenes.zip");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src={logo} alt="Logo" className="h-10 w-10" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Prompt2Pic Studio
                </h1>
                <p className="text-sm text-gray-500">Professional AI Image Generator</p>
              </div>
            </div>
            <div className="text-sm text-gray-400">@AshokLimbu</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Character Manager */}
        <CharacterManager 
          characters={characters}
          setCharacters={setCharacters}
        />

        {/* Story Prompt Section */}
        <Card className="mb-8 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100">
            <CardTitle className="flex items-center text-gray-800">
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg mr-3">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              Story Prompt
              <span className="ml-3 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                AI Powered
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <VoiceToText
              targetId="topic-textarea"
              onTranscript={handleVoiceTranscript}
              lang="en-US"
            />
            
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Describe Your Story
              </label>
              <div className="relative">
                <textarea
                  id="topic-textarea"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Tell your story... Use c1, c2, etc. to reference your characters. Example: 'c1 and c2 exploring an ancient magical forest at sunset'"
                  rows={5}
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-gray-700 placeholder-gray-400 bg-white"
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {topic.length}/1000
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button
                onClick={handleGeneratePrompts}
                loading={loading}
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 px-8"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {loading ? "Crafting Prompts..." : "Generate 5 Scene Prompts"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Generated Prompts and Images */}
        {prompts.length > 0 && (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <ImageIcon className="w-6 h-6 mr-3 text-indigo-600" />
                  Generated Scenes
                  <span className="ml-3 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                    {prompts.length} scenes ready
                  </span>
                </h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {prompts.map(({ scene, prompt }) => (
                  <ImageGenerator
                    key={scene}
                    ref={(el) => (imageRefs.current[scene] = el)}
                    scene={scene}
                    prompt={prompt}
                  />
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
              <CardContent className="py-8">
                <div className="text-center space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Batch Operations
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                    <Button
                      onClick={handleGenerateAllImages}
                      loading={generatingAll}
                      variant="default"
                      size="lg"
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 flex-1"
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      {generatingAll ? "Generating All..." : "Generate All Images"}
                    </Button>

                    <Button
                      onClick={handleDownloadAll}
                      variant="success"
                      size="lg"
                      className="flex-1"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download All (ZIP)
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Generate all images at once or download them as a convenient ZIP file
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty State */}
        {prompts.length === 0 && !loading && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Ready to Create Amazing Images?
                </h3>
                <p className="text-gray-500">
                  Set up your characters and describe your story to generate 5 unique AI-powered image prompts
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">Character-aware</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">Voice input</span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">Multiple formats</span>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full">Batch download</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p className="mb-2">Built with ❤️ using React, Tailwind CSS, and AI</p>
            <p>© 2024 Prompt2Pic Studio - Transform your ideas into visual stories</p>
          </div>
        </div>
      </footer>
    </div>
  );
}