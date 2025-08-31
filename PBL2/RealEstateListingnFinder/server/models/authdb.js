const mongoose = require('mongoose')

const url = process.env.MONGODB_URL

mongoose.connect(url).then(() => {
    console.log("database connected");
}).catch(error => {
    console.log("error is persist",error);
})