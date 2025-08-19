import { createServer } from "http";

const users = [
  {
    id: 1,
    name: "Ganesh",
    age: 4,
  },
  {
    id: 2,
    name: "Nirajan",
    age: 5,
  },
];
const PORT = 8000;
const server = createServer((req, res) => {
  if (req.url === "/api/users" && req.method === "GET") {
    res.setHeader("Content-Type", "application/json");
    res.write(JSON.stringify(users));
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`The server is running in ${PORT}`);
});
