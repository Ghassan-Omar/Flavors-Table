const express = require("express");
const axios = require("axios");
const router = express.Router();

// Get Random Recipe
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
        } );

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

// Search Recipes by Ingredients
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
                ingredients: ingredients.trim( ),
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

// Get Recipe Information by ID
router.get("/:id", async (req, res) => {
    try {
        const recipeId = req.params.id;
        
        // Validate recipe ID
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
        } );

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
            extendedIngredients: recipe.extendedIngredients || []
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
