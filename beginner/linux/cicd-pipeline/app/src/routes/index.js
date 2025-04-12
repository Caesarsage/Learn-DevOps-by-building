const express = require("express");
const router = express.Router();

// Home route
router.get("/", (req, res) => {
  res.json({ message: "Welcome to our API!" });
});

// Health check route
router.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// User route with parameter
router.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  // In a real app, you would fetch the user from a database
  if (userId === '123') {
    return res.json({
      id: '123',
      name: 'John Doe',
      email: 'john@example.com'
    });
  }
  res.status(404).json({ error: { message: 'User not found' } });
});

module.exports = router;
