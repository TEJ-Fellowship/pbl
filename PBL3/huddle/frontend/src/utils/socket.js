import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(userId) {
    if (!this.socket) {
      this.socket = io('http://localhost:8080', {
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.isConnected = true;
        if (userId) {
          this.socket.emit('join', userId);
        }
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinChat(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-chat', chatId);
    }
  }

  leaveChat(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-chat', chatId);
    }
  }

  sendMessage(chatId, message) {
    if (this.socket && this.isConnected) {
      this.socket.emit('new-message', { chatId, message });
    }
  }

  onMessageReceived(callback) {
    if (this.socket) {
      this.socket.on('message-received', callback);
    }
  }

  offMessageReceived() {
    if (this.socket) {
      this.socket.off('message-received');
    }
  }

  startTyping(chatId, userId, username) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', { chatId, userId, username });
    }
  }

  stopTyping(chatId, userId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('stop-typing', { chatId, userId });
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user-typing', callback);
    }
  }

  onUserStopTyping(callback) {
    if (this.socket) {
      this.socket.on('user-stop-typing', callback);
    }
  }

  offTypingEvents() {
    if (this.socket) {
      this.socket.off('user-typing');
      this.socket.off('user-stop-typing');
    }
  }
}

export default new SocketService();