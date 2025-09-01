import mongoose from 'mongoose';

// Connect MongoDB Atlas
const connectDB = async () => {
  try {
    await mongoose.connect(
      'mongodb+srv://communityflow77:community2025@cluster0.sa9pjfu.mongodb.net/communityDB?retryWrites=true&w=majority&appName=Cluster0'
    );
    console.log('MongoDB is connected successfully!');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // stop server if DB fails
  }
};

// ================= Program Schema =================
const programSchema = new mongoose.Schema({
  title: { type: String, maxlength: 50, required: true },
  description: String,
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  image: String,
  location: { type: String, maxlength: 50 },
  category: { type: String, enum: ['Social Work', 'Education', 'Health', 'Corporation'] },
  organizer: { type: String, maxlength: 100 },
  contact: String,
  volunteersNeeded: { type: Number, required: true },
  tags: [String],
  status: { type: String, enum: ["Upcoming", "Ongoing", "Completed"] },
  resources: String
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual field for tasks associated with this program
programSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'programId',
});

// Model
const Program = mongoose.model('ProgramEvent', programSchema);

// ================= Task Schema =================
const taskSchema = new mongoose.Schema({
  taskName: { type: String, required: true },
  description: { type: String, minlength: 3, maxlength: 100, required: true },
  date: { type: Date, required: true },
  category: { type: String, enum: ["Social Work", "Health", "Education"], required: true },
  assignee: String,
  completed: { type: Boolean, default: false },
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProgramEvent",
    required: true
  }
});

const Task = mongoose.model('Task', taskSchema);

export { connectDB, Program, Task };
