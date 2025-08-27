import mongoose from 'mongoose';

// connect mongoDB atlas
// mongoose.connect('mongodb+srv://communityflow77:community2025@cluster0.sa9pjfu.mongodb.net/communityDB?retryWrites=true&w=majority&appName=Cluster0', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// }).then(() => console.log('MongoDB is connected successfully!'))
//     .catch((err) => console.error('MongoDB connection error:', err));

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

// create an schema
const taskSchema = new mongoose.Schema({
    taskName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        minlength: 3,
        maxlength: 100,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    category: {
        type: String,
        enum: ["Social Work", "Health", "Education"],
        required: true
    },
    assignee: String,
    completed: { 
      type: Boolean, 
      default: false 
    }
});

const Task = mongoose.model('Task', taskSchema);

// const task1 = new Task({
//     taskName: "Save trees and plants",
//     description: "The development of urbanarea is sacrifies of trees",
//     date: "2025-08-24",
//     category: "Social work",
//     assignee: "Binita Hamal"
// });

// task1.save().then(() => console.log('The data is append successfully!')).catch(err => console.error(err));

export {connectDB, Task};