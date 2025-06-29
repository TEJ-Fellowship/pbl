const express = require('express');
const passport = require('passport');

const router = express.Router();


router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Add your Google callback route too (important!)
router.get('google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/profile'); // Redirect on successful login
    }
);

router.get('/profile', (req, res) => {
    res.send(`Welcome ${req.user.displayName}`);
});

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

module.exports = router;
