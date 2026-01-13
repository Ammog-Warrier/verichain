/**
 * PostgreSQL Database Connection Pool
 */

const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5433'),
    database: process.env.POSTGRES_DB || 'verichain',
    user: process.env.POSTGRES_USER || 'verichain',
    password: process.env.POSTGRES_PASSWORD || 'verichain_secret',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
    console.log('📦 PostgreSQL connected');
});

pool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err);
});

/**
 * Query helper with logging
 */
async function query(text, params) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        if (duration > 100) {
            console.log(`Slow query (${duration}ms):`, text.substring(0, 50));
        }
        return result;
    } catch (error) {
        console.error('Database query error:', error.message);
        throw error;
    }
}

/**
 * Get a single row
 */
async function getOne(text, params) {
    const result = await query(text, params);
    return result.rows[0] || null;
}

/**
 * Get all rows
 */
async function getAll(text, params) {
    const result = await query(text, params);
    return result.rows;
}

module.exports = {
    pool,
    query,
    getOne,
    getAll
};
