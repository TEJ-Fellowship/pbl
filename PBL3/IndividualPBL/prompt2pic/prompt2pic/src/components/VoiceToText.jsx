import React, { useEffect, useRef, useState } from "react";
import { Mic, Square, Volume2 } from 'lucide-react';
import Button from './ui/Button';

export default function VoiceToText({
  targetId = "topic-textarea",
  lang = "en-US",
  continuous = true,
  interimResults = true,
  onTranscript,
}) {
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const [listening, setListening] = useState(false);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  const updateTarget = (text) => {
    const el = document.getElementById(targetId);
    if (el) {
      el.value = text;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (typeof onTranscript === "function") onTranscript(text);
  };

  const startListening = () => {
    if (listening) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    finalTranscriptRef.current = "";

    const rec = new SpeechRecognition();
    rec.lang = lang;
    rec.continuous = continuous;
    rec.interimResults = interimResults;

    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscriptRef.current += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      updateTarget(finalTranscriptRef.current + interim);
    };

    rec.onerror = (err) => {
      console.error("SpeechRecognition error", err);
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
    };

    try {
      rec.start();
      recognitionRef.current = rec;
      setListening(true);
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      setListening(false);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {}
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <Button
        onClick={startListening}
        disabled={listening}
        variant={listening ? "success" : "default"}
        className={listening ? "animate-pulse" : ""}
      >
        {listening ? (
          <>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full animate-ping mr-2" />
              <Volume2 className="w-4 h-4 mr-2" />
              Listening...
            </div>
          </>
        ) : (
          <>
            <Mic className="w-4 h-4 mr-2" />
            Voice Input
          </>
        )}
      </Button>

      <Button
        onClick={stopListening}
        disabled={!listening}
        variant="danger"
        size="default"
      >
        <Square className="w-4 h-4 mr-2" />
        Stop Recording
      </Button>
    </div>
  );
}