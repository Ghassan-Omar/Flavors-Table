const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
const homeRoutes = require("./routes/home");
const recipeRoutes = require("./routes/recipes");

app.use("/", homeRoutes);
app.use("/recipes", recipeRoutes);

// Basic error handling
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
    
    // Generic error response
    res.status(500).json({ 
        error: "Something went wrong on our end. Please try again later." 
    });
});

// Handle 404 errors
app.use((req, res) => {
    res.status(404).json({ 
        error: "Endpoint not found" 
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});
