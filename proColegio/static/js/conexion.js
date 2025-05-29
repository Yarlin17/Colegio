const { Pool } = require('pg');

const pool = new Pool({
  user: 'tu_usuario',         // Cambia por tu usuario de PostgreSQL
  host: 'localhost',
  database: 'colegio_pablo_neruda', // Cambia por el nombre de tu base de datos
  password: 'tu_contraseña',  // Cambia por tu contraseña de PostgreSQL
  port: 5432,                 // Puerto por defecto de PostgreSQL
});

module.exports = pool;
