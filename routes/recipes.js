const express = require("express");
const axios = require("axios");
const verifyToken = require("../middleware/verifyToken");
const router = express.Router();

// Get Random Recipe (from Spoonacular API) - Public route
router.get("/random", async (req, res) => {
    try {
        // Check if API key is configured
        if (!process.env.SPOONACULAR_API_KEY || process.env.SPOONACULAR_API_KEY === 'your_api_key_here') {
            return res.status(500).json({
                error: "API key not configured. Please set up your Spoonacular API key."
            });
        }

        const response = await axios.get("https://api.spoonacular.com/recipes/random", {
            params: {
                apiKey: process.env.SPOONACULAR_API_KEY,
                number: 1
            },
            timeout: 10000 // 10 second timeout
        });

        if (!response.data || !response.data.recipes || response.data.recipes.length === 0) {
            return res.status(404).json({
                error: "No random recipe found. Please try again."
            });
        }

        const recipe = response.data.recipes[0];

        // Extract ingredients from extendedIngredients
        const ingredients = recipe.extendedIngredients ?
            recipe.extendedIngredients.map(ingredient => ingredient.original) : [];

        // Extract instructions
        let instructions = "";
        if (recipe.instructions) {
            instructions = recipe.instructions;
        } else if (recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0) {
            instructions = recipe.analyzedInstructions[0].steps
                .map(step => `${step.number}. ${step.step}`)
                .join(" ");
        }

        const simplifiedRecipe = {
            id: recipe.id,
            title: recipe.title || "Untitled Recipe",
            image: recipe.image || "/placeholder-recipe.jpg",
            instructions: instructions || "No instructions available.",
            ingredients: ingredients
        };

        res.json(simplifiedRecipe);
    } catch (error) {
        console.error("Error fetching random recipe:", error);

        if (error.response) {
            // API responded with error status
            const status = error.response.status;
            if (status === 401) {
                return res.status(401).json({
                    error: "Invalid API key. Please check your Spoonacular API configuration."
                });
            } else if (status === 429) {
                return res.status(429).json({
                    error: "API rate limit exceeded. Please try again later."
                });
            } else if (status >= 500) {
                return res.status(503).json({
                    error: "Spoonacular service is temporarily unavailable."
                });
            }
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                error: "Unable to connect to recipe service. Please check your internet connection."
            });
        } else if (error.code === 'ECONNABORTED') {
            return res.status(408).json({
                error: "Request timed out. Please try again."
            });
        }

        res.status(500).json({
            error: "Failed to fetch random recipe. Please try again later."
        });
    }
});

// Search Recipes by Ingredients (from Spoonacular API) - Public route
router.get("/search", async (req, res) => {
    try {
        const ingredients = req.query.ingredients;
        if (!ingredients || ingredients.trim() === "") {
            return res.status(400).json({
                error: "Ingredients parameter is required and cannot be empty."
            });
        }

        // Check if API key is configured
        if (!process.env.SPOONACULAR_API_KEY || process.env.SPOONACULAR_API_KEY === 'your_api_key_here') {
            return res.status(500).json({
                error: "API key not configured. Please set up your Spoonacular API key."
            });
        }

        const response = await axios.get("https://api.spoonacular.com/recipes/findByIngredients", {
            params: {
                apiKey: process.env.SPOONACULAR_API_KEY,
                ingredients: ingredients.trim(),
                number: 12,
                ranking: 1,
                ignorePantry: true
            },
            timeout: 15000 // 15 second timeout for search
        });

        if (!response.data || !Array.isArray(response.data)) {
            return res.status(404).json({
                error: "No recipes found for the given ingredients."
            });
        }

        const simplifiedRecipes = response.data.map(recipe => ({
            id: recipe.id,
            title: recipe.title || "Untitled Recipe",
            image: recipe.image || "/placeholder-recipe.jpg",
            usedIngredients: recipe.usedIngredients || [],
            missedIngredients: recipe.missedIngredients || []
        }));

        res.json(simplifiedRecipes);
    } catch (error) {
        console.error("Error searching recipes:", error);

        if (error.response) {
            const status = error.response.status;
            if (status === 401) {
                return res.status(401).json({
                    error: "Invalid API key. Please check your Spoonacular API configuration."
                });
            } else if (status === 429) {
                return res.status(429).json({
                    error: "API rate limit exceeded. Please try again later."
                });
            } else if (status >= 500) {
                return res.status(503).json({
                    error: "Spoonacular service is temporarily unavailable."
                });
            }
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                error: "Unable to connect to recipe service. Please check your internet connection."
            });
        } else if (error.code === 'ECONNABORTED') {
            return res.status(408).json({
                error: "Search request timed out. Please try again with fewer ingredients."
            });
        }

        res.status(500).json({
            error: "Failed to search recipes. Please try again later."
        });
    }
});

// CRUD Operations for PostgreSQL Database - All Protected Routes

// GET /recipes/all - Get all favorite recipes for authenticated user
router.get("/all", verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        console.log("Fetching recipes for userId:", userId);
        const pool = req.app.locals.pool;

        const result = await pool.query(
            "SELECT * FROM recipes WHERE user_id = $1 ORDER BY id DESC",
            [userId]
        );

        res.json({
            recipes: result.rows,
            total: result.rows.length
        });
        
    } catch (error) {
        console.error("Error fetching user recipes from database:", error);
        res.status(500).json({
            error: "Failed to fetch your recipes from database."
        });
    }
});

// POST /recipes - Add a new recipe to database for authenticated user
router.post("/", verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { title, image, instructions, ingredients, readyIn, spoonacular_id } = req.body;

        // Validate required fields
        if (!title) {
            return res.status(400).json({
                error: "Title is required."
            });
        }

        const pool = req.app.locals.pool;

        // Check if recipe already exists for this user
        if (spoonacular_id) {
            const existingRecipe = await pool.query(
                "SELECT id FROM recipes WHERE user_id = $1 AND spoonacular_id = $2",
                [userId, spoonacular_id]
            );

            if (existingRecipe.rows.length > 0) {
                return res.status(409).json({
                    error: "This recipe is already in your favorites."
                });
            }
        }

        const result = await pool.query(
            "INSERT INTO recipes (user_id, title, image, instructions, ingredients, readyIn, spoonacular_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [userId, title, image || null, instructions || null, JSON.stringify(ingredients) || null, readyIn || null, spoonacular_id || null]
        );

        res.status(201).json({
            message: "Recipe added to favorites successfully.",
            recipe: result.rows[0]
        });
    } catch (error) {
        console.error("Error adding recipe to database:", error);

        if (error.code === '23505') { // PostgreSQL unique violation
            return res.status(409).json({
                error: "This recipe is already in your favorites."
            });
        }

        res.status(500).json({
            error: "Failed to add recipe to your favorites."
        });
    }
});

// PUT /recipes/:id - Update a recipe in database for authenticated user
router.put("/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const recipeId = parseInt(req.params.id);
        const { title, image, instructions, ingredients, readyIn } = req.body;

        // Validate recipe ID
        if (isNaN(recipeId)) {
            return res.status(400).json({
                error: "Valid recipe ID is required."
            });
        }

        // Validate required fields
        if (!title) {
            return res.status(400).json({
                error: "Title is required."
            });
        }

        const pool = req.app.locals.pool;

        // Check if recipe exists and belongs to user
        const existingRecipe = await pool.query(
            "SELECT id FROM recipes WHERE id = $1 AND user_id = $2",
            [recipeId, userId]
        );

        if (existingRecipe.rows.length === 0) {
            return res.status(404).json({
                error: "Recipe not found or you don't have permission to edit it."
            });
        }

        const result = await pool.query(
            "UPDATE recipes SET title = $1, image = $2, instructions = $3, ingredients = $4, readyIn = $5 WHERE id = $6 AND user_id = $7 RETURNING *",
            [title, image || null, instructions || null, JSON.stringify(ingredients) || null, readyIn || null, recipeId, userId]
        );

        res.json({
            message: "Recipe updated successfully.",
            recipe: result.rows[0]
        });
    } catch (error) {
        console.error("Error updating recipe in database:", error);
        res.status(500).json({
            error: "Failed to update recipe in database."
        });
    }
});

// DELETE /recipes/:id - Delete a recipe from database for authenticated user
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const recipeId = parseInt(req.params.id);

        // Validate recipe ID
        if (isNaN(recipeId)) {
            return res.status(400).json({
                error: "Valid recipe ID is required."
            });
        }

        const pool = req.app.locals.pool;

        const result = await pool.query(
            "DELETE FROM recipes WHERE id = $1 AND user_id = $2 RETURNING *",
            [recipeId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Recipe not found or you don't have permission to delete it."
            });
        }

        res.json({
            message: "Recipe deleted successfully.",
            deletedRecipe: result.rows[0]
        });
    } catch (error) {
        console.error("Error deleting recipe from database:", error);
        res.status(500).json({
            error: "Failed to delete recipe from database."
        });
    }
});

// Get Recipe Information by ID (from database or Spoonacular API) - Public route
// This is the combined route handler for GET /recipes/:id
router.get("/:id", async (req, res) => {
    try {
        const recipeId = req.params.id; // Correctly using req.params.id

        // Check if this is a database ID (integer) or Spoonacular ID
        if (!isNaN(recipeId)) {
            // Try to get from database first
            const pool = req.app.locals.pool;
            const dbResult = await pool.query("SELECT * FROM recipes WHERE id = $1", [parseInt(recipeId)]);

            if (dbResult.rows.length > 0) {
                const recipe = dbResult.rows[0];
                // The 'ingredients' column is JSONB, so it's already parsed by the 'pg' driver.
                // Ensure ingredients are in the expected array format for consistency
                if (recipe.ingredients) {
                    if (typeof recipe.ingredients === 'string') {
                        try {
                            recipe.ingredients = JSON.parse(recipe.ingredients);
                        } catch (parseError) {
                            console.error("Error parsing ingredients as JSON string (DB):", parseError);
                            recipe.ingredients = []; // Fallback to empty array on parse error
                        }
                    } else if (typeof recipe.ingredients !== 'object' || recipe.ingredients === null) {
                        // If it's not a string and not an object (e.g., null, undefined, number)
                        console.warn("Unexpected type for recipe.ingredients (DB):", typeof recipe.ingredients, recipe.ingredients);
                        recipe.ingredients = [];
                    }
                    // If it's already an object (like an array), it's fine.
                } else {
                    recipe.ingredients = []; // Ensure it's an empty array if null/undefined
                }
                return res.json(recipe);
            }
        }

        // If not found in database or not a valid database ID, try Spoonacular API
        // Validate recipe ID for Spoonacular API (must be numeric)
        if (!recipeId || isNaN(recipeId)) {
            return res.status(400).json({
                error: "Valid recipe ID is required."
            });
        }

        // Check if API key is configured
        if (!process.env.SPOONACULAR_API_KEY || process.env.SPOONACULAR_API_KEY === 'your_api_key_here') {
            return res.status(500).json({
                error: "API key not configured. Please set up your Spoonacular API key."
            });
        }

        const response = await axios.get(`https://api.spoonacular.com/recipes/${recipeId}/information`, {
            params: {
                apiKey: process.env.SPOONACULAR_API_KEY,
                includeNutrition: false
            },
            timeout: 10000 // 10 second timeout
        });

        if (!response.data) {
            return res.status(404).json({
                error: "Recipe not found."
            });
        }

        const recipe = response.data;

        // Extract instructions
        let instructions = "";
        if (recipe.instructions) {
            instructions = recipe.instructions;
        } else if (recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0) {
            instructions = recipe.analyzedInstructions[0].steps
                .map(step => `${step.number}. ${step.step}`)
                .join(" ");
        }

        const detailedRecipe = {
            id: recipe.id,
            title: recipe.title || "Untitled Recipe",
            image: recipe.image || "/placeholder-recipe.jpg",
            summary: recipe.summary || "No summary available.",
            readyInMinutes: recipe.readyInMinutes || null,
            instructions: instructions || "No instructions available.",
            extendedIngredients: recipe.extendedIngredients || [] // Keep original extendedIngredients
        };

        res.json(detailedRecipe);
    } catch (error) {
        console.error("Error fetching recipe details:", error);

        if (error.response) {
            const status = error.response.status;
            if (status === 404) {
                return res.status(404).json({
                    error: "Recipe not found. It may have been removed or the ID is incorrect."
                });
            } else if (status === 401) {
                return res.status(401).json({
                    error: "Invalid API key. Please check your Spoonacular API configuration."
                });
            } else if (status === 429) {
                return res.status(429).json({
                    error: "API rate limit exceeded. Please try again later."
                });
            } else if (status >= 500) {
                return res.status(503).json({
                    error: "Spoonacular service is temporarily unavailable."
                });
            }
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                error: "Unable to connect to recipe service. Please check your internet connection."
            });
        } else if (error.code === 'ECONNABORTED') {
            return res.status(408).json({
                error: "Request timed out. Please try again."
            });
        }

        res.status(500).json({
            error: "Failed to fetch recipe details. Please try again later."
        });
    }
});

module.exports = router;