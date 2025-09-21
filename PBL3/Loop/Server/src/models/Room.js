// ============= FIXED Room.js Model =============
// models/Room.js
import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    maxLength: 50
  },
  code: { 
    type: String, 
    required: true, 
    unique: true,
    length: 6
  },
  creator: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  players: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  maxPlayers: {
    type: Number,
    default: 10,
    min: 2,
    max: 20
  },
  description: {
    type: String,
    maxLength: 200,
    default: ""
  }
}, { 
  timestamps: true 
});

// Index for efficient queries
roomSchema.index({ creator: 1, createdAt: -1 });
roomSchema.index({ isActive: 1 });
roomSchema.index({ code: 1 });

// Ensure creator is always in players array
roomSchema.pre('save', function(next) {
  if (this.creator && !this.players.includes(this.creator)) {
    this.players.push(this.creator);
  }
  next();
});

export default mongoose.model("Room", roomSchema);
