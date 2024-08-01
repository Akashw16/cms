// backend/server.js

const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'wani12345',
    database: 'course_management'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Database connected');
});

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).send('Token required.');

    jwt.verify(token, 'your_secret_key', (err, user) => {
        if (err) return res.status(403).send('Invalid token.');
        req.user = user;
        next();
    });
};

// Register endpoint
app.post('/register', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).send('Email and password are required.');
    }

    db.query('INSERT INTO user (email, password) VALUES (?, ?)', [email, password], (err) => {
        if (err) return res.status(500).send(err);
        res.send('User registered successfully');
    });
});

// Login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM user WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(401).send('User not found.');

        const user = results[0];
        if (password !== user.password) {
            return res.status(401).send('Invalid password.');
        }

        const token = jwt.sign({ email: user.email }, 'your_secret_key', { expiresIn: '1h' });
        res.json({ token });
    });
});

// Get all courses
app.get('/courses', authenticateToken, (req, res) => {
    db.query('SELECT * FROM course', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Get a single course by ID
app.get('/courses/:cid', authenticateToken, (req, res) => {
    const { cid } = req.params;
    db.query('SELECT * FROM course WHERE cid = ?', [cid], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).send('Course not found.');
        res.json(results[0]);
    });
});

// Add a new course
app.post('/courses', authenticateToken, (req, res) => {
    const { cname, fees, duration } = req.body;
    if (!cname || fees <= 0 || duration <= 0) {
        return res.status(400).send('All fields are required and must be valid.');
    }

    db.query('INSERT INTO course (cname, fees, duration) VALUES (?, ?, ?)', [cname, fees, duration], (err) => {
        if (err) return res.status(500).send(err);
        res.send('Course added successfully');
    });
});

// Update a course
app.put('/courses/:cid', authenticateToken, (req, res) => {
    const { cid } = req.params;
    const { cname, fees, duration } = req.body;

    if (!cname || fees <= 0 || duration <= 0) {
        return res.status(400).send('All fields are required and must be valid.');
    }

    db.query('UPDATE course SET cname = ?, fees = ?, duration = ? WHERE cid = ?', [cname, fees, duration, cid], (err) => {
        if (err) return res.status(500).send(err);
        res.send('Course updated successfully');
    });
});

// Delete a course
app.delete('/courses/:cid', authenticateToken, (req, res) => {
    const { cid } = req.params;
    db.query('DELETE FROM course WHERE cid = ?', [cid], (err) => {
        if (err) return res.status(500).send(err);
        res.send('Course deleted successfully');
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
