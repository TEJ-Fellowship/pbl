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

const port = process.env.PORT || 3000;

connectDB().then(() => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
});
