const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.connect()
    .then(() => {
        console.log("Connected to PostgreSQL database");
        app.locals.pool = pool;
        
        // Start server only after successful database connection
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    })
    .catch((err) => {
        console.error("Could not connect to database:", err);
        console.error("Please check your DATABASE_URL environment variable");
        process.exit(1);
    });

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-frontend-domain.com'] // Replace with your actual frontend domain
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Routes
const homeRoutes = require("./routes/home");
const recipeRoutes = require("./routes/recipes");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");

// Mount routes
app.use("/", homeRoutes);
app.use("/recipes", recipeRoutes);
app.use("/auth", authRoutes);  // Changed from /api/auth to /auth
app.use("/users", userRoutes); // Changed from /api/users to /users

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        message: "Flavor Table API",
        version: "3.0.0",
        endpoints: {
            auth: {
                "POST /auth/register": "Register a new user",
                "POST /auth/login": "Login user",
                "GET /auth/me": "Get current user info"
            },
            users: {
                "GET /users": "Get all users (authenticated)",
                "GET /users/:id": "Get user by ID (authenticated)",
                "PUT /users/:id": "Update user (authenticated)",
                "PUT /users/:id/password": "Change password (authenticated)",
                "DELETE /users/:id": "Delete user (authenticated)"
            },
            recipes: {
                "GET /recipes/random": "Get random recipe from Spoonacular",
                "GET /recipes/search": "Search recipes by ingredients",
                "GET /recipes/all": "Get user's favorite recipes (authenticated)",
                "POST /recipes": "Save recipe to favorites (authenticated)",
                "GET /recipes/:id": "Get recipe details",
                "PUT /recipes/:id": "Update favorite recipe (authenticated)",
                "DELETE /recipes/:id": "Delete favorite recipe (authenticated)"
            }
        }
    });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
    console.error("Error details:", err);
    
    // Handle different types of errors
    if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") {
        return res.status(503).json({ 
            error: "Service temporarily unavailable. Please try again later." 
        });
    }
    
    if (err.response && err.response.status === 401) {
        return res.status(401).json({ 
            error: "API authentication failed. Please check your API key." 
        });
    }
    
    if (err.response && err.response.status === 429) {
        return res.status(429).json({ 
            error: "Too many requests. Please wait a moment before trying again." 
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: "Invalid token. Please log in again."
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: "Token has expired. Please log in again."
        });
    }

    // Database errors
    if (err.code && err.code.startsWith('23')) { // PostgreSQL constraint violations
        return res.status(400).json({
            error: "Database constraint violation. Please check your input."
        });
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: err.message
        });
    }
    
    // Generic error response
    res.status(500).json({ 
        error: process.env.NODE_ENV === 'production' 
            ? "Something went wrong on our end. Please try again later."
            : err.message
    });
});

// Handle 404 errors for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        error: "API endpoint not found",
        path: req.path
    });
});

// Handle 404 errors for other routes
app.use((req, res) => {
    // For non-API routes, serve the main page (SPA behavior)
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, "public", "index.html"));
    } else {
        res.status(404).json({ 
            error: "Endpoint not found",
            path: req.path
        });
    }
});

// Graceful shutdown handlers
const gracefulShutdown = (signal) => {
    console.log(`Received ${signal}. Graceful shutdown...`);
    
    // Close database connections
    pool.end(() => {
        console.log('Database pool has ended.');
        process.exit(0);
    });
    
    // Force exit after 10 seconds
    setTimeout(() => {
        console.log('Forcing shutdown...');
        process.exit(1);
    }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});

module.exports = app;