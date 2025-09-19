import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  getChatMessages,
  sendTextMessage,
  sendVoiceMessage,
  deleteMessage,
} from "../api/chat";
import {
  ArrowLeft,
  Send,
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
} from "lucide-react";
import Cookies from "js-cookie";

const ChatWindow = ({ chat, onBack, onUpdateChats }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  const currentUserId = getCurrentUserId();
  const otherParticipant = chat.participants.find(
    (p) => p._id !== currentUserId
  );

  useEffect(() => {
    fetchMessages();
  }, [chat._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function getCurrentUserId() {
    try {
      const token = Cookies.get("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload._id || payload.id || payload.userId;
      }
    } catch (error) {
      console.error("Error getting user ID:", error);
    }
    return null;
  }

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const messagesData = await getChatMessages(chat._id);
      setMessages(messagesData);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendTextMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const message = await sendTextMessage(chat._id, newMessage.trim());
      setMessages((prev) => [...prev, message]);
      setNewMessage("");
      onUpdateChats();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setRecordingTime(0);
      setIsRecording(true);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
      };

      mediaRecorder.start(1000);

      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        setRecordingTime(elapsedSeconds);

        if (elapsedSeconds >= 60) {
          stopRecording();
        }
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      clearInterval(timerRef.current);
      setIsRecording(false);
    }
  };

  const handleSendVoiceMessage = async () => {
    if (!audioBlob) return;

    try {
      setSending(true);
      const message = await sendVoiceMessage(
        chat._id,
        audioBlob,
        recordingTime
      );
      setMessages((prev) => [...prev, message]);
      setAudioBlob(null);
      setRecordingTime(0);
      onUpdateChats();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this message?"))
      return;

    try {
      await deleteMessage(messageId);
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      toast.success("Message deleted");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-teal-100 bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg">
        <button
          onClick={onBack}
          className="mr-4 p-2 hover:bg-white/20 rounded-full transition-all duration-200 text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold mr-3 shadow-md">
          {otherParticipant?.username?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="font-semibold text-white">
            {otherParticipant?.username}
          </h2>
          <p className="text-sm text-white/80">{otherParticipant?.email}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-teal-600/70">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender._id === currentUserId;
            return (
              <div
                key={message._id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-md ${
                    isOwn
                      ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white"
                      : "bg-white border border-teal-100 text-slate-700"
                  }`}
                >
                  {/* Sender Name */}
                  <p
                    className={`text-xs font-semibold mb-1 ${
                      isOwn ? "text-white/80" : "text-teal-600"
                    }`}
                  >
                    {message.sender?.username}
                  </p>

                  {/* Message Content */}
                  {message.messageType === "text" ? (
                    <p>{message.content}</p>
                  ) : (
                    <div className="flex items-center">
                      <audio
                        src={message.voiceUrl}
                        controls
                        className="flex-shrink-0 w-40 md:w-60 lg:w-72"
                        style={{ minWidth: "160px" }}
                      />
                      <span className="ml-2 text-xs opacity-75 whitespace-nowrap">
                        {formatTime(message.duration)}
                      </span>
                    </div>
                  )}

                  {/* Time + Delete */}
                  <div className="flex items-center justify-between mt-1">
                    <p
                      className={`text-xs ${
                        isOwn ? "text-white/70" : "text-slate-500"
                      }`}
                    >
                      {formatMessageTime(message.createdAt)}
                    </p>
                    {isOwn && (
                      <button
                        onClick={() => handleDeleteMessage(message._id)}
                        className="ml-2 opacity-75 hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Recording UI */}
      {(isRecording || audioBlob) && (
        <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-t border-teal-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {isRecording && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-teal-700">Recording...</span>
                  <span className="font-mono text-sm text-teal-600">
                    {formatTime(recordingTime)}
                  </span>
                </div>
              )}
              {audioBlob && !isRecording && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm text-teal-700">
                    Voice message ready
                  </span>
                  <span className="font-mono text-sm text-teal-600">
                    {formatTime(recordingTime)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {isRecording && (
                <button
                  onClick={stopRecording}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                >
                  <Square className="w-4 h-4" />
                </button>
              )}
              {audioBlob && !isRecording && (
                <>
                  <button
                    onClick={() => {
                      setAudioBlob(null);
                      setRecordingTime(0);
                    }}
                    className="px-3 py-1 text-sm text-teal-600 hover:text-teal-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendVoiceMessage}
                    disabled={sending}
                    className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50 shadow-md"
                  >
                    Send
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Input */}
      {!isRecording && !audioBlob && (
        <div className="p-4 border-t border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50">
          <form
            onSubmit={handleSendTextMessage}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-teal-200 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white shadow-sm"
              disabled={sending}
            />
            <button
              type="button"
              onClick={startRecording}
              className="p-2 text-teal-600 hover:text-teal-700 hover:bg-teal-100 rounded-full transition-all duration-200"
            >
              <Mic className="w-5 h-5" />
            </button>
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="p-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-full hover:from-teal-600 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
