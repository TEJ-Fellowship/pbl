const someRoutes = require("express").Router();
const User = require("../models/User");

someRoutes.get('/api/someData', (req, res) => {
    res.send('The express is working fine!');
});

module.exports = someRoutes;