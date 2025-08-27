import express from 'express';
import cors from 'cors';
import { connectDB, Task } from './mongo.js';
// initializing express framework
const app = express();

//middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Get request is tested and implemented successfully');
})

app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await Task.find();
        res.status(200).json(tasks);
    } catch (err) {
        res.status(500).json({ message: "Error fetching tasks", err});
    }
})

app.post('/api/tasks', async (req, res) => {
    try {
        const task = new Task(req.body);
        console.log('Task is going to be saved');
        await task.save();
        console.log('Task is saved!')
        res.status(201).json({ message: "Task saved successfully!", task });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
})

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


const port = process.env.PORT || 3000;

connectDB().then(() => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
});
