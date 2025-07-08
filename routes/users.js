const express = require("express");
const bcrypt = require("bcrypt");
const verifyToken = require("../middleware/verifyToken");
const router = express.Router();

// Get All Users (Protected Route - Admin only for testing)
router.get("/", verifyToken, async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        
        const result = await pool.query(
            "SELECT id, username, email FROM users ORDER BY id ASC"
        );

        res.json({
            users: result.rows,
            total: result.rows.length
        });

    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            error: "Failed to fetch users."
        });
    }
});

// Get User by ID (Protected Route)
router.get("/:id", verifyToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // Validate user ID
        if (isNaN(userId)) {
            return res.status(400).json({
                error: "Invalid user ID."
            });
        }

        // Users can only access their own information
        if (req.user.userId !== userId) {
            return res.status(403).json({
                error: "Access denied. You can only access your own information."
            });
        }

        const pool = req.app.locals.pool;
        
        const result = await pool.query(
            "SELECT id, username, email FROM users WHERE id = $1",
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "User not found."
            });
        }

        res.json({
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({
            error: "Failed to fetch user information."
        });
    }
});

// Update User (Protected Route)
router.put("/:id", verifyToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { username, email } = req.body;
        
        // Validate user ID
        if (isNaN(userId)) {
            return res.status(400).json({
                error: "Invalid user ID."
            });
        }

        // Users can only update their own information
        if (req.user.userId !== userId) {
            return res.status(403).json({
                error: "Access denied. You can only update your own information."
            });
        }

        // Validate required fields
        if (!username || !email) {
            return res.status(400).json({
                error: "Username and email are required."
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: "Please provide a valid email address."
            });
        }

        // Validate username length
        if (username.length < 3 || username.length > 50) {
            return res.status(400).json({
                error: "Username must be between 3 and 50 characters long."
            });
        }

        const pool = req.app.locals.pool;

        // Check if username or email already exists for other users
        const existingUser = await pool.query(
            "SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3",
            [username, email, userId]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                error: "Username or email already exists."
            });
        }

        // Update user
        const result = await pool.query(
            "UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING id, username, email",
            [username, email, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "User not found."
            });
        }

        res.json({
            message: "User updated successfully.",
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating user:", error);
        
        if (error.code === '23505') { // PostgreSQL unique violation
            return res.status(409).json({
                error: "Username or email already exists."
            });
        }
        
        res.status(500).json({
            error: "Failed to update user information."
        });
    }
});

// Change Password (Protected Route)
router.put("/:id/password", verifyToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { currentPassword, newPassword } = req.body;
        
        // Validate user ID
        if (isNaN(userId)) {
            return res.status(400).json({
                error: "Invalid user ID."
            });
        }

        // Users can only change their own password
        if (req.user.userId !== userId) {
            return res.status(403).json({
                error: "Access denied. You can only change your own password."
            });
        }

        // Validate required fields
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: "Current password and new password are required."
            });
        }

        // Validate new password strength
        if (newPassword.length < 6) {
            return res.status(400).json({
                error: "New password must be at least 6 characters long."
            });
        }

        const pool = req.app.locals.pool;

        // Get current user password
        const userResult = await pool.query(
            "SELECT password FROM users WHERE id = $1",
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                error: "User not found."
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userResult.rows[0].password);

        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                error: "Current password is incorrect."
            });
        }

        // Hash new password
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await pool.query(
            "UPDATE users SET password = $1 WHERE id = $2",
            [hashedNewPassword, userId]
        );

        res.json({
            message: "Password changed successfully."
        });

    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({
            error: "Failed to change password."
        });
    }
});

// Delete User (Protected Route)
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // Validate user ID
        if (isNaN(userId)) {
            return res.status(400).json({
                error: "Invalid user ID."
            });
        }

        // Users can only delete their own account
        if (req.user.userId !== userId) {
            return res.status(403).json({
                error: "Access denied. You can only delete your own account."
            });
        }

        const pool = req.app.locals.pool;

        // Start transaction
        await pool.query('BEGIN');

        try {
            // Delete user's recipes first (foreign key constraint)
            await pool.query("DELETE FROM recipes WHERE user_id = $1", [userId]);
            
            // Delete user
            const result = await pool.query(
                "DELETE FROM users WHERE id = $1 RETURNING id, username",
                [userId]
            );

            if (result.rows.length === 0) {
                await pool.query('ROLLBACK');
                return res.status(404).json({
                    error: "User not found."
                });
            }

            // Commit transaction
            await pool.query('COMMIT');

            res.json({
                message: "User account deleted successfully.",
                deletedUser: result.rows[0]
            });

        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({
            error: "Failed to delete user account."
        });
    }
});

module.exports = router;