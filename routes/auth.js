const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();

// User Registration
router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({
                error: "Username, email, and password are required."
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: "Please provide a valid email address."
            });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({
                error: "Password must be at least 6 characters long."
            });
        }

        // Validate username length
        if (username.length < 3 || username.length > 50) {
            return res.status(400).json({
                error: "Username must be between 3 and 50 characters long."
            });
        }

        const pool = req.app.locals.pool;

        // Check if user already exists
        const existingUser = await pool.query(
            "SELECT id FROM users WHERE username = $1 OR email = $2",
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                error: "Username or email already exists."
            });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const result = await pool.query(
            "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email",
            [username, email, hashedPassword]
        );

        const newUser = result.rows[0];

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: newUser.id, 
                username: newUser.username,
                email: newUser.email 
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.status(201).json({
            message: "User registered successfully.",
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email
            },
            token: token
        });

    } catch (error) {
        console.error("Registration error:", error);
        
        if (error.code === '23505') { // PostgreSQL unique violation
            return res.status(409).json({
                error: "Username or email already exists."
            });
        }
        
        res.status(500).json({
            error: "Registration failed. Please try again later."
        });
    }
});

// User Login
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate required fields
        if (!username || !password) {
            return res.status(400).json({
                error: "Username and password are required."
            });
        }

        const pool = req.app.locals.pool;

        // Find user by username or email
        const result = await pool.query(
            "SELECT id, username, email, password FROM users WHERE username = $1 OR email = $1",
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: "Invalid username or password."
            });
        }

        const user = result.rows[0];

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                error: "Invalid username or password."
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username,
                email: user.email 
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({
            message: "Login successful.",
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            },
            token: token
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            error: "Login failed. Please try again later."
        });
    }
});

// Get Current User (Protected Route)
router.get("/me", async (req, res) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                error: "Access denied. No token provided."
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const pool = req.app.locals.pool;

        // Get user details
        const result = await pool.query(
            "SELECT id, username, email FROM users WHERE id = $1",
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "User not found."
            });
        }

        const user = result.rows[0];

        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Get user error:", error);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: "Token has expired. Please log in again."
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: "Invalid token. Please log in again."
            });
        }
        
        res.status(500).json({
            error: "Failed to get user information."
        });
    }
});

module.exports = router;