const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const redis = require("redis");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// CORS Configuration
const allowedOrigins = [
  'http://localhost:30080',
  'http://localhost:3000',
  'http://127.0.0.1:30080',
  'http://127.0.0.1:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Still allow, but log it (for debugging)
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Redis connection
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  password: process.env.REDIS_PASSWORD,
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));
redisClient.connect();

// Initialize database
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        priority VARCHAR(50) DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database initialized");
  } catch (err) {
    console.error("Database initialization error:", err);
  }
}

initDatabase();

// Health check endpoints
// app.get("/health", (req, res) => {
//   res.status(200).json({ status: "healthy", service: "task-backend" });
// });

// Update to test rolling update
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "task-backend",
    version: "v2", // Added version
    uptime: process.uptime(), // Added uptime
  });
});

app.get("/ready", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    await redisClient.ping();
    res
      .status(200)
      .json({ status: "ready", database: "connected", cache: "connected" });
  } catch (err) {
    res.status(503).json({ status: "not ready", error: err.message });
  }
});

// API Routes

// Get all tasks
app.get("/api/tasks", async (req, res) => {
  try {
    // Try cache first
    const cached = await redisClient.get("tasks:all");
    if (cached) {
      console.log("📦 Cache hit");
      return res.json(JSON.parse(cached));
    }

    // Query database
    const result = await pool.query(
      "SELECT * FROM tasks ORDER BY created_at DESC"
    );

    // Cache for 60 seconds
    await redisClient.setEx("tasks:all", 60, JSON.stringify(result.rows));

    console.log("Database query");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Get single task
app.get("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching task:", err);
    res.status(500).json({ error: "Failed to fetch task" });
  }
});

// Create task
app.post("/api/tasks", async (req, res) => {
  try {
    const { title, description, status, priority } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const result = await pool.query(
      "INSERT INTO tasks (title, description, status, priority) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, description, status || "pending", priority || "medium"]
    );

    // Invalidate cache
    await redisClient.del("tasks:all");

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating task:", err);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// Update task
app.put("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority } = req.body;

    const result = await pool.query(
      "UPDATE tasks SET title = $1, description = $2, status = $3, priority = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *",
      [title, description, status, priority, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Invalidate cache
    await redisClient.del("tasks:all");

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// Delete task
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Invalidate cache
    await redisClient.del("tasks:all");

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Error deleting task:", err);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// Stats endpoint
app.get("/api/stats", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') as completed
      FROM tasks
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Database: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`Redis: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
  console.log(`CORS: Allowing origins:`, allowedOrigins);
});
