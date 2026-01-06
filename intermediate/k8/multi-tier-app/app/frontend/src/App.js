import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:30081/api";

function App() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "pending",
  });

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/tasks`);
      setTasks(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch tasks: " + err.message);
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/stats`);
      setStats(response.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchStats();
    const interval = setInterval(() => {
      fetchStats();
    }, 10000); // Update stats every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Create task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      alert("Please enter a task title");
      return;
    }

    try {
      await axios.post(`${API_URL}/tasks`, newTask);
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        status: "pending",
      });
      fetchTasks();
      fetchStats();
    } catch (err) {
      alert("Failed to create task: " + err.message);
    }
  };

  // Update task status
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const task = tasks.find((t) => t.id === id);
      await axios.put(`${API_URL}/tasks/${id}`, {
        ...task,
        status: newStatus,
      });
      fetchTasks();
      fetchStats();
    } catch (err) {
      alert("Failed to update task: " + err.message);
    }
  };

  // Delete task
  const handleDeleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/tasks/${id}`);
      fetchTasks();
      fetchStats();
    } catch (err) {
      alert("Failed to delete task: " + err.message);
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "#10b981";
      case "in_progress":
        return "#3b82f6";
      case "pending":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  if (loading && tasks.length === 0) {
    return <div className="loading">Loading tasks...</div>;
  }

  return (
    <div className="App">
      <header className="header">
        <h1>📋 Task Manager</h1>
        <p>A Kubernetes focused Project</p>
      </header>

      {/* Stats Dashboard */}
      <div className="stats">
        <div className="stat-card">
          <h3>Total Tasks</h3>
          <p className="stat-number">{stats.total || 0}</p>
        </div>
        <div className="stat-card pending">
          <h3>Pending</h3>
          <p className="stat-number">{stats.pending || 0}</p>
        </div>
        <div className="stat-card in-progress">
          <h3>In Progress</h3>
          <p className="stat-number">{stats.in_progress || 0}</p>
        </div>
        <div className="stat-card completed">
          <h3>Completed</h3>
          <p className="stat-number">{stats.completed || 0}</p>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      {/* Create Task Form */}
      <div className="create-task">
        <h2>Create New Task</h2>
        <form onSubmit={handleCreateTask}>
          <input
            type="text"
            placeholder="Task title..."
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Task description..."
            value={newTask.description}
            onChange={(e) =>
              setNewTask({ ...newTask, description: e.target.value })
            }
            rows="3"
          />
          <div className="form-row">
            <select
              value={newTask.priority}
              onChange={(e) =>
                setNewTask({ ...newTask, priority: e.target.value })
              }
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <button type="submit">➕ Create Task</button>
          </div>
        </form>
      </div>
      {/* Task List */}
      <div className="tasks">
        <h2>Tasks ({tasks.length})</h2>
        {tasks.length === 0 ? (
          <p className="no-tasks">No tasks yet. Create one above!</p>
        ) : (
          <div className="task-list">
            {tasks.map((task) => (
              <div key={task.id} className="task-card">
                <div className="task-header">
                  <h3>{task.title}</h3>
                  <div className="badges">
                    <span
                      className="badge priority"
                      style={{
                        backgroundColor: getPriorityColor(task.priority),
                      }}
                    >
                      {task.priority}
                    </span>
                    <span
                      className="badge status"
                      style={{ backgroundColor: getStatusColor(task.status) }}
                    >
                      {task.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}
                <div className="task-footer">
                  <small>
                    Created: {new Date(task.created_at).toLocaleString()}
                  </small>
                  <div className="task-actions">
                    <select
                      value={task.status}
                      onChange={(e) =>
                        handleUpdateStatus(task.id, e.target.value)
                      }
                      className="status-select"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="delete-btn"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
