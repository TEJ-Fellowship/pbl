const express = require('express');
// const cors = require('cors');

const app = express();
// app.use(
//   cors({
//     origin: "http://localhost:3000",
//   })
// );

const scoresRouter = require('./controllers/scores');

app.use(express.json());
app.use('/api/scores', scoresRouter);

const PORT = process.env.PORT || 3000;


const start = async () => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();