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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-200 bg-white">
        <button
          onClick={onBack}
          className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
          {otherParticipant?.username?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">
            {otherParticipant?.username}
          </h2>
          <p className="text-sm text-gray-500">{otherParticipant?.email}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender._id === currentUserId;
            return (
              // <div
              //   key={message._id}
              //   className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              // >
              //   <div
              //     className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              //       isOwn
              //         ? "bg-blue-500 text-white"
              //         : "bg-gray-200 text-gray-900"
              //     }`}
              //   >
              //     {message.messageType === "text" ? (
              //       <p>{message.content}</p>
              //     ) : (
              //       <div className="flex items-center">
              //         <audio
              //           src={message.voiceUrl}
              //           controls
              //           className="flex-shrink-0 w-40 md:w-60 lg:w-72"
              //           style={{ minWidth: "160px" }}
              //         >
              //           Your browser does not support the audio element.
              //         </audio>
              //         <span className="ml-2 text-xs opacity-75 whitespace-nowrap">
              //           {formatTime(message.duration)}
              //         </span>
              //       </div>
              //     )}
              //     <div className="flex items-center justify-between mt-1">
              //       <p
              //         className={`text-xs ${
              //           isOwn ? "text-blue-100" : "text-gray-500"
              //         }`}
              //       >
              //         {formatMessageTime(message.createdAt)}
              //       </p>
              //       {isOwn && (
              //         <button
              //           onClick={() => handleDeleteMessage(message._id)}
              //           className="ml-2 opacity-75 hover:opacity-100"
              //         >
              //           <Trash2 className="w-3 h-3" />
              //         </button>
              //       )}
              //     </div>
              //   </div>
              // </div>
              <div
                key={message._id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwn
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-900"
                  }`}
                >
                  {/* Sender Name */}
                  <p
                    className={`text-xs font-semibold mb-1 ${
                      isOwn ? "text-blue-100" : "text-gray-700"
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
                        isOwn ? "text-blue-100" : "text-gray-500"
                      }`}
                    >
                      {formatMessageTime(message.createdAt)}
                    </p>
                    {isOwn && (
                      <button
                        onClick={() => handleDeleteMessage(message._id)}
                        className="ml-2 opacity-75 hover:opacity-100"
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
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {isRecording && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Recording...</span>
                  <span className="font-mono text-sm">
                    {formatTime(recordingTime)}
                  </span>
                </div>
              )}
              {audioBlob && !isRecording && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Voice message ready
                  </span>
                  <span className="font-mono text-sm">
                    {formatTime(recordingTime)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {isRecording && (
                <button
                  onClick={stopRecording}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
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
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendVoiceMessage}
                    disabled={sending}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
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
        <div className="p-4 border-t border-gray-200 bg-white">
          <form
            onSubmit={handleSendTextMessage}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={sending}
            />
            <button
              type="button"
              onClick={startRecording}
              className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <Mic className="w-5 h-5" />
            </button>
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
