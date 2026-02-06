const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// MariaDB connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test database connection on startup
pool.query('SELECT 1')
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Database connection failed:', err.message));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// GET request for questions
app.get('/', async (req, res) => {
  try {
    const { question } = req.query;

    // If no question parameter provided
    if (!question) {
      return res.send('Sorry not be able to understand you');
    }

    // Search for exact match (case-insensitive)
    const [rows] = await pool.query(
      'SELECT reply FROM chatbot_hints WHERE LOWER(question) = LOWER(?)',
      [question]
    );

    // If match found, return the reply
    if (rows.length > 0) {
      return res.send(rows[0].reply);
    }

    // No match found
    res.send('Sorry not be able to understand you');

  } catch (error) {
    console.error('Error processing chatbot query:', error);
    res.send('Sorry not be able to understand you');
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Chatbot microservice running on port ${PORT}`);
});
