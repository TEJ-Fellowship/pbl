import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { connectDB, Task, Program } from './mongo.js';

// ES module __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ================= Task Routes (unchanged) =================
app.get('/', (req, res) => {
  res.send('Get request is tested and implemented successfully');
});

app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await Task.find().populate("programId", "title description start end");
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/api/tasks', async (req, res) => {
  try {
    const task = new Task(req.body);
    console.log('Task is going to be saved');
    await task.save();
    console.log('Task is saved!');
    res.status(201).json({ message: "Task saved successfully!", task });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { completed: req.body.completed },
      { new: true }
    );
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= Program Routes =================

// Create uploads folder if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('Created uploads folder');
}

// Serve uploaded images statically
app.use('/uploads', express.static(uploadsDir));

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Add new program with optional image
app.post('/api/programs', upload.single('image'), async (req, res) => {
  try {
    const body = req.body;

    // Handle tags: array or comma-separated string
    let tags = [];
    if (body.tags) {
      if (Array.isArray(body.tags)) tags = body.tags;
      else tags = body.tags.split(',').map(t => t.trim());
    }

    const program = new Program({
      ...body,
      tags,
      image: req.file ? `/uploads/${req.file.filename}` : ""
    });

    await program.save();
    console.log('Program saved!');
    res.status(201).json(program);
  } catch (err) {
    console.error("Error saving program:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all programs with tasks populated
// Get all programs with their tasks
app.get('/api/programs', async (req, res) => {
  try {
    const programs = await Program.find().lean(); // .lean() returns plain JS objects
    const programsWithTasks = await Promise.all(
      programs.map(async (program) => {
        const tasks = await Task.find({ programId: program._id });
        return { ...program, tasks };
      })
    );
    res.status(200).json(programsWithTasks);
  } catch (err) {
    console.error("Error fetching programs:", err);
    res.status(500).json({ error: err.message });
  }
});


// ================= Start Server =================
const port = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
});
