// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // For serving the dashboard

// Database setup
const db = new sqlite3.Database('./irrigation.db');
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS irrigation_history (id INTEGER PRIMARY KEY, timestamp TEXT, duration INTEGER, water_used REAL, moisture_before INTEGER, moisture_after INTEGER, trigger_type TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS sensor_data (id INTEGER PRIMARY KEY, timestamp TEXT, soil_moisture REAL, temperature REAL, humidity REAL, solar_voltage REAL)");
  db.run("CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, moisture_threshold INTEGER, watering_duration INTEGER, reading_interval INTEGER, power_save_mode TEXT)");
});

// Routes
app.get('/api/sensor-data', (req, res) => {
  db.all("SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 100", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/irrigation-history', (req, res) => {
  db.all("SELECT * FROM irrigation_history ORDER BY timestamp DESC LIMIT 20", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/settings', (req, res) => {
  db.get("SELECT * FROM settings ORDER BY id DESC LIMIT 1", (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(row || { moisture_threshold: 40, watering_duration: 5, reading_interval: 10, power_save_mode: 'auto' });
  });
});

app.post('/api/settings', (req, res) => {
  const { moisture_threshold, watering_duration, reading_interval, power_save_mode } = req.body;
  db.run("INSERT INTO settings (moisture_threshold, watering_duration, reading_interval, power_save_mode) VALUES (?, ?, ?, ?)", 
    [moisture_threshold, watering_duration, reading_interval, power_save_mode], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID });
  });
});

app.post('/api/manual-watering', (req, res) => {
  // This endpoint would trigger a command to the Arduino to start manual watering
  // For now, we'll just simulate it by adding to the history
  const { duration, water_used, moisture_before, moisture_after } = req.body;
  const timestamp = new Date().toISOString();
  
  db.run("INSERT INTO irrigation_history (timestamp, duration, water_used, moisture_before, moisture_after, trigger_type) VALUES (?, ?, ?, ?, ?, ?)",
    [timestamp, duration, water_used, moisture_before, moisture_after, 'Manual'], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID });
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});