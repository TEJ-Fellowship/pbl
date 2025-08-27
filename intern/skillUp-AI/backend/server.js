const express = require("express");
const app = express();
app.use(express.json());

app.get("/info", (request, response) => {
  response.send(`
    <div>Hello from server</div>
    `);
});

const PORT = 3001;
app.listen(PORT, ()=>{
    console.log(`server is running on port ${PORT}`);
})