const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// Endpoint de Health Check
app.get('/api/health', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT NOW()');
    res.status(200).json({
      status: 'UP',
      timestamp: dbRes.rows[0].now,
      service: 'devops-backend-api',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'DOWN',
      error: error.message,
      service: 'devops-backend-api'
    });
  }
});

// Endpoint de Métricas Básicas (para observabilidad)
app.get('/api/metrics', (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.status(200).json({
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMB: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024)
    },
    cpuTimeSeconds: process.cpuUsage().user / 1000000
  });
});

// Obtener tareas del sistema
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM system_tasks ORDER BY id ASC');
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Crear una nueva tarea
app.post('/api/tasks', async (req, res) => {
  const { title, description, category, status } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, message: 'El título es obligatorio' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO system_tasks (title, description, category, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description || '', category || 'General', status || 'Pending']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = app;
