import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import '../VideoUpload.css';

const VideoUpload = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Cleanup stream when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleCaptureClick = () => {
    setShowModal(true);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check if video is approximately 1 second (allow some tolerance)
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        if (video.duration > 2) {
          alert('Please select a video that is 1 second or less in duration.');
          return;
        }
        
        const videoURL = URL.createObjectURL(file);
        setRecordedVideo(videoURL);
        setRecordedBlob(file);
        setShowModal(false);
      };
      
      video.src = URL.createObjectURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setShowModal(false);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm'
    });
    
    mediaRecorderRef.current = mediaRecorder;
    const chunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const videoURL = URL.createObjectURL(blob);
      setRecordedVideo(videoURL);
      setRecordedBlob(blob);
      
      // Stop camera stream
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      videoRef.current.srcObject = null;
    };

    // Start countdown
    setCountdown(3);
    
    setTimeout(() => {
      setIsRecording(true);
      mediaRecorder.start();
      
      // Stop recording after 1 second
      setTimeout(() => {
        stopRecording();
      }, 1000);
    }, 3000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setCountdown(0);
    }
  };

  const cancelRecording = () => {
    setRecordedVideo(null);
    setRecordedBlob(null);
    setCountdown(0);
    setIsRecording(false);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      videoRef.current.srcObject = null;
    }
  };

  const publishVideo = async () => {
    if (!recordedBlob) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('video', recordedBlob, 'moment.webm');
    formData.append('title', 'My Moment');
    formData.append('description', 'A 1-second moment');

    try {
      const response = await axios.post('/api/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        },
      });

      console.log('Video uploaded successfully:', response.data);
      alert('Video published successfully!');
      
      // Reset state
      setRecordedVideo(null);
      setRecordedBlob(null);
      setUploadProgress(0);
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Error publishing video. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="video-upload-container">
      <h2>Capture Your Moment</h2>
      
      {!recordedVideo && !streamRef.current && (
        <button className="capture-btn" onClick={handleCaptureClick}>
          📸 Capture the Moment
        </button>
      )}

      {/* Modal for choosing upload method */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Choose Upload Method</h3>
            <div className="modal-buttons">
              <button onClick={() => fileInputRef.current.click()}>
                📁 Upload from Files
              </button>
              <button onClick={startCamera}>
                📹 Use Camera
              </button>
            </div>
            <button className="close-btn" onClick={() => setShowModal(false)}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="video/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {/* Camera view */}
      {streamRef.current && (
        <div className="camera-container">
          <video
            ref={videoRef}
            autoPlay
            muted
            className="camera-video"
          />
          
          {countdown > 0 && (
            <div className="countdown">{countdown}</div>
          )}
          
          <div className="camera-controls">
            {!isRecording && countdown === 0 && (
              <>
                <button className="record-btn" onClick={startRecording}>
                  🔴 Start Recording
                </button>
                <button className="cancel-btn" onClick={cancelRecording}>
                  ❌ Cancel
                </button>
              </>
            )}
            
            {isRecording && (
              <div className="recording-indicator">
                🔴 Recording... (1s)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recorded video preview */}
      {recordedVideo && (
        <div className="preview-container">
          <h3>Preview Your Moment</h3>
          <video
            src={recordedVideo}
            controls
            className="preview-video"
            loop
          />
          
          <div className="preview-controls">
            {isUploading ? (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p>Uploading... {uploadProgress}%</p>
              </div>
            ) : (
              <>
                <button className="publish-btn" onClick={publishVideo}>
                  🚀 Publish
                </button>
                <button className="cancel-btn" onClick={cancelRecording}>
                  🗑️ Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;