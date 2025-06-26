document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const searchRecipesLink = document.getElementById("search-recipes-link");
    const randomRecipeLink = document.getElementById("random-recipe-link");
    const favoritesLink = document.getElementById("favorites-link");

    const searchSection = document.getElementById("search-section");
    const randomSection = document.getElementById("random-section");
    const favoritesSection = document.getElementById("favorites-section");

    const ingredientsInput = document.getElementById("ingredients-input");
    const searchButton = document.getElementById("search-button");
    const searchResults = document.getElementById("search-results");

    const generateRandomButton = document.getElementById("generate-random-button");
    const randomRecipeDisplay = document.getElementById("random-recipe-display");

    const favoritesList = document.getElementById("favorites-list");

    const recipeDetailsModal = document.getElementById("recipe-details-modal");
    const closeButton = document.querySelector(".close-button");
    const detailsTitle = document.getElementById("details-title");
    const detailsImage = document.getElementById("details-image");
    const detailsSummary = document.getElementById("details-summary");
    const detailsCookingTime = document.getElementById("details-cooking-time");
    const detailsInstructions = document.getElementById("details-instructions");
    const detailsIngredients = document.getElementById("details-ingredients");

    // Utility Functions
    const showSection = (sectionToShow) => {
        // Hide all sections
        searchSection.style.display = "none";
        randomSection.style.display = "none";
        favoritesSection.style.display = "none";
        
        // Show target section
        sectionToShow.style.display = "block";
        sectionToShow.classList.add("fade-in");
        
        // Update active nav link
        document.querySelectorAll("nav a").forEach(link => link.classList.remove("active"));
    };

    const showLoading = (element, text = "Loading...") => {
        element.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div class="loading"></div>
                <p style="margin-top: 1rem; color: rgba(255, 255, 255, 0.8);">${text}</p>
            </div>
        `;
    };

    const showError = (element, message) => {
        element.innerHTML = `
            <div class="empty-state">
                <h3>⚠️ Oops!</h3>
                <p>${message}</p>
            </div>
        `;
    };

    const showEmptyState = (element, title, message) => {
        element.innerHTML = `
            <div class="empty-state">
                <h3>${title}</h3>
                <p>${message}</p>
            </div>
        `;
    };

    const createRecipeCard = (recipe, isFromSearch = false, isFromFavorites = false) => {
        const recipeCard = document.createElement("div");
        recipeCard.classList.add("recipe-card", "fade-in");
        
        let ingredientsInfo = "";
        if (isFromSearch && recipe.usedIngredients && recipe.missedIngredients) {
            ingredientsInfo = `
                <p><strong>✅ Used Ingredients:</strong> ${recipe.usedIngredients.map(ing => ing.name).join(", ")}</p>
                <p><strong>❌ Missing Ingredients:</strong> ${recipe.missedIngredients.map(ing => ing.name).join(", ")}</p>
            `;
        } else if (recipe.ingredients) {
            ingredientsInfo = `
                <p><strong>🥘 Ingredients:</strong> ${recipe.ingredients.slice(0, 3).join(", ")}${recipe.ingredients.length > 3 ? "..." : ""}</p>
            `;
        }

        let instructionsInfo = "";
        if (recipe.instructions) {
            const shortInstructions = recipe.instructions.length > 150 
                ? recipe.instructions.substring(0, 150) + "..." 
                : recipe.instructions;
            instructionsInfo = `<p><strong>📋 Instructions:</strong> ${shortInstructions}</p>`;
        }

        recipeCard.innerHTML = `
            <h3>${recipe.title}</h3>
            <img src="${recipe.image}" alt="${recipe.title}" loading="lazy">
            ${ingredientsInfo}
            ${instructionsInfo}
            <div style="margin-top: 1rem;">
                <button class="view-details-button" data-id="${recipe.id}">👁️ View Details</button>
                ${!isFromFavorites ? `<button class="save-favorite-button" data-id="${recipe.id}" data-title="${recipe.title}" data-image="${recipe.image}">❤️ Save to Favorites</button>` : `<button class="remove-favorite-button" data-id="${recipe.id}">🗑️ Remove</button>`}
            </div>
        `;
        
        return recipeCard;
    };

    // Navigation Event Listeners
    searchRecipesLink.addEventListener("click", (e) => {
        e.preventDefault();
        showSection(searchSection);
        searchRecipesLink.classList.add("active");
    });

    randomRecipeLink.addEventListener("click", (e) => {
        e.preventDefault();
        showSection(randomSection);
        randomRecipeLink.classList.add("active");
    });

    favoritesLink.addEventListener("click", (e) => {
        e.preventDefault();
        showSection(favoritesSection);
        favoritesLink.classList.add("active");
        displayFavorites();
    });

    // Search Recipes Functionality
    const searchRecipes = async () => {
        const ingredients = ingredientsInput.value.trim();
        if (!ingredients) {
            alert("Please enter some ingredients to search for recipes.");
            return;
        }

        showLoading(searchResults, "Searching for delicious recipes...");

        try {
            const response = await fetch(`/recipes/search?ingredients=${encodeURIComponent(ingredients)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const recipes = await response.json();
            
            searchResults.innerHTML = "";
            
            if (recipes.length === 0) {
                showEmptyState(searchResults, "🔍 No Recipes Found", "Try different ingredients or check your spelling.");
                return;
            }

            recipes.forEach(recipe => {
                const recipeCard = createRecipeCard(recipe, true);
                searchResults.appendChild(recipeCard);
            });

        } catch (error) {
            console.error("Error searching recipes:", error);
            showError(searchResults, "Failed to search recipes. Please check your connection and try again.");
        }
    };

    searchButton.addEventListener("click", searchRecipes);
    
    ingredientsInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            searchRecipes();
        }
    });

    // Random Recipe Functionality
    generateRandomButton.addEventListener("click", async () => {
        showLoading(randomRecipeDisplay, "Generating a random recipe for you...");

        try {
            const response = await fetch("/recipes/random");
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const recipe = await response.json();
            
            randomRecipeDisplay.innerHTML = "";
            const recipeCard = createRecipeCard(recipe);
            randomRecipeDisplay.appendChild(recipeCard);

        } catch (error) {
            console.error("Error fetching random recipe:", error);
            showError(randomRecipeDisplay, "Failed to generate random recipe. Please try again.");
        }
    });

    // Favorites Functionality
    const displayFavorites = () => {
        let favorites = JSON.parse(localStorage.getItem("favoriteRecipes")) || [];
        favoritesList.innerHTML = "";
        
        if (favorites.length === 0) {
            showEmptyState(favoritesList, "❤️ No Favorites Yet", "Start exploring recipes and save your favorites!");
            return;
        }

        favorites.forEach(recipe => {
            const favoriteCard = createRecipeCard(recipe, false, true);
            favoritesList.appendChild(favoriteCard);
        });
    };

    // Event Delegation for Dynamic Buttons
    document.addEventListener("click", async (e) => {
        // Save to Favorites
        if (e.target.classList.contains("save-favorite-button")) {
            const recipeId = e.target.dataset.id;
            const recipeTitle = e.target.dataset.title;
            const recipeImage = e.target.dataset.image;
            
            let favorites = JSON.parse(localStorage.getItem("favoriteRecipes")) || [];
            
            if (!favorites.some(fav => fav.id === recipeId)) {
                favorites.push({ 
                    id: recipeId, 
                    title: recipeTitle, 
                    image: recipeImage 
                });
                localStorage.setItem("favoriteRecipes", JSON.stringify(favorites));
                
                // Visual feedback
                e.target.innerHTML = "✅ Added!";
                e.target.style.background = "linear-gradient(45deg, #28a745, #20c997)";
                setTimeout(() => {
                    e.target.innerHTML = "❤️ Save to Favorites";
                    e.target.style.background = "";
                }, 2000);
            } else {
                alert(`${recipeTitle} is already in your favorites.`);
            }
        }

        // Remove from Favorites
        if (e.target.classList.contains("remove-favorite-button")) {
            const recipeId = e.target.dataset.id;
            let favorites = JSON.parse(localStorage.getItem("favoriteRecipes")) || [];
            favorites = favorites.filter(fav => fav.id !== recipeId);
            localStorage.setItem("favoriteRecipes", JSON.stringify(favorites));
            displayFavorites();
        }

        // View Recipe Details
        if (e.target.classList.contains("view-details-button")) {
            const recipeId = e.target.dataset.id;
            
            try {
                const response = await fetch(`/recipes/${recipeId}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const recipe = await response.json();

                detailsTitle.textContent = recipe.title;
                detailsImage.src = recipe.image;
                detailsImage.alt = recipe.title;
                detailsSummary.innerHTML = recipe.summary || "No summary available.";
                detailsCookingTime.textContent = recipe.readyInMinutes || "Not specified";
                detailsInstructions.innerHTML = recipe.instructions || "No instructions available.";

                detailsIngredients.innerHTML = "";
                if (recipe.extendedIngredients && recipe.extendedIngredients.length > 0) {
                    recipe.extendedIngredients.forEach(ingredient => {
                        const li = document.createElement("li");
                        li.textContent = ingredient.original;
                        detailsIngredients.appendChild(li);
                    });
                } else {
                    const li = document.createElement("li");
                    li.textContent = "No ingredients information available.";
                    detailsIngredients.appendChild(li);
                }

                recipeDetailsModal.style.display = "block";
                document.body.style.overflow = "hidden"; // Prevent background scrolling

            } catch (error) {
                console.error("Error fetching recipe details:", error);
                alert("Failed to load recipe details. Please try again.");
            }
        }
    });

    // Modal Close Functionality
    closeButton.addEventListener("click", () => {
        recipeDetailsModal.style.display = "none";
        document.body.style.overflow = "auto";
    });

    window.addEventListener("click", (e) => {
        if (e.target === recipeDetailsModal) {
            recipeDetailsModal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    });

    // Keyboard Navigation
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && recipeDetailsModal.style.display === "block") {
            recipeDetailsModal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    });

    // Initialize the app
    searchRecipesLink.classList.add("active");
});
