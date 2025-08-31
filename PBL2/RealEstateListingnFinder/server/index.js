const dotenv = require('dotenv')
const path = require('path')
dotenv.config({ path: path.resolve("../.env") }); // <-- point to parent folder);
const express = require('express');
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const AuthRouter = require('./routes/AuthRouter')

require('./models/authdb')


const PORT = process.env.PORT || 8080;
app.use(bodyParser.json())
app.use(cors())
app.use('/auth', AuthRouter)

app.get('/ping', (req, res) => {
    res.send('Hi server')
})


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})