const express = require("express");
const app = express();
app.use(express.json());

app.get("/info", (request, response) => {
  response.send(`
    <div>Hello from server</div>
    `);
});

app.get("/api/skillup/register", (request, response)=>{
    const {fullName, email, password}= request.body;
    
})


const PORT = 3001;
app.listen(PORT, ()=>{
    console.log(`server is running on port ${PORT}`);
})