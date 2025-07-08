const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            error: "Access denied. No token provided." 
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("Token verification error:", error);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: "Token has expired. Please log in again." 
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                error: "Invalid token. Please log in again." 
            });
        } else {
            return res.status(401).json({ 
                error: "Token verification failed." 
            });
        }
    }
};

module.exports = verifyToken;