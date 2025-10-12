import express from "express";
import cors from "cors";

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Test server running", status: "ok" });
});

app.post("/api/chat", (req, res) => {
  const { message } = req.body;
  res.json({
    response: `Echo: ${message}`,
    sessionId: "test-session",
    sources: [],
    confidence: { score: 100, level: "High", factors: ["Test response"] },
  });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
