const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
  res.json({
    totalQuizzes: 0,
    avgScore: 0,
  })
})

module.exports = router
