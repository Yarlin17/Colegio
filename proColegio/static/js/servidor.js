const express = require('express');
const pool = require('./conexion');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Obtener todos los estudiantes
app.get('/api/estudiantes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Estudiantes');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener todos los profesores
app.get('/api/profesores', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Profesores');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener todas las aulas
app.get('/api/aulas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Aulas');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener todas las asignaturas
app.get('/api/asignaturas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Asignaturas');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener todos los grupos
app.get('/api/grupos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Grupos');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener todos los horarios
app.get('/api/horarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Horarios');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint raíz para comprobar que el backend funciona
app.get('/', (req, res) => {
  res.send('Backend Colegio Pablo Neruda funcionando');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});