import React, { useState, useEffect, useRef } from "react";
const useSpeechRecognition = () => {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const [transcript, setTranscript] = useState("");
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("The browser doesn't support speech recognition");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      let result = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        result += event.results[i][0].transcript;
      }
      setTranscript(result);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        setListening(false);
      }
    };

    recognition.onend = () => {
      setListening(false);
    };
    recognitionRef.current = recognition;

    if (listening) {
      recognition.start();
    }

    return () => {
      recognition.stop();
    };
  }, [listening]);

  const startListening = () => {
    setListening(true);
  };

  const stopListening = () => {
    setListening(false);
  };
  return {
    transcript,
    setTranscript,
    listening,
    startListening,
    stopListening,
  };
};

export default useSpeechRecognition;
