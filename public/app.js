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

    // Authentication Functions
    function getToken() {
        return localStorage.getItem("authToken");
    }

    function getUser() {
        const user = localStorage.getItem("currentUser");
        return user ? JSON.parse(user) : null;
    }

    function removeToken() {
        localStorage.removeItem("authToken");
    }

    function removeUser() {
        localStorage.removeItem("currentUser");
    }

    function logout() {
        removeToken();
        removeUser();
        updateAuthUI();
        showSection(searchSection);
        searchRecipesLink.classList.add("active");
    }

    function isAuthenticated() {
        return !!getToken();
    }

    // API Helper Functions
    function getAuthHeaders() {
        const token = getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    async function makeAuthenticatedRequest(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        // Handle token expiration
        if (response.status === 401) {
            logout();
            alert("Your session has expired. Please log in again.");
            window.location.href = "/auth.html";
            return null;
        }

        return response;
    }

    // UI Update Functions
    function updateAuthUI() {
        const user = getUser();
        const header = document.querySelector("header");
        
        // Remove existing auth elements
        const existingAuthNav = header.querySelector(".auth-nav");
        if (existingAuthNav) {
            existingAuthNav.remove();
        }

        // Create auth navigation
        const authNav = document.createElement("div");
        authNav.className = "auth-nav";
        authNav.style.cssText = `
            text-align: center;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
        `;

        if (user) {
            authNav.innerHTML = `
                <span style="color: rgba(255, 255, 255, 0.8); margin-right: 1rem;">
                    Welcome, ${user.username}!
                </span>
                <button id="logout-button" style="
                    background: linear-gradient(45deg, #dc3545, #c82333);
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 15px;
                    cursor: pointer;
                    font-family: 'Poppins', sans-serif;
                    font-size: 0.9rem;
                    transition: all 0.3s ease;
                ">Logout</button>
            `;
            
            // Add logout functionality
            authNav.querySelector("#logout-button").addEventListener("click", logout);
        } else {
            authNav.innerHTML = `
                <a href="/auth.html" style="
                    background: linear-gradient(45deg, #28a745, #20c997);
                    color: white;
                    text-decoration: none;
                    padding: 0.5rem 1rem;
                    border-radius: 15px;
                    font-family: 'Poppins', sans-serif;
                    font-size: 0.9rem;
                    transition: all 0.3s ease;
                    display: inline-block;
                ">Login / Register</a>
            `;
        }

        header.appendChild(authNav);
    }

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
            const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
            ingredientsInfo = `
                <p><strong>🥘 Ingredients:</strong> ${ingredients.slice(0, 3).join(", ")}${ingredients.length > 3 ? "..." : ""}</p>
            `;
        }

        let instructionsInfo = "";
        if (recipe.instructions) {
            const shortInstructions = recipe.instructions.length > 150 
                ? recipe.instructions.substring(0, 150) + "..." 
                : recipe.instructions;
            instructionsInfo = `<p><strong>📋 Instructions:</strong> ${shortInstructions}</p>`;
        }

        const saveButtonText = isAuthenticated() ? "❤️ Save to Favorites" : "❤️ Login to Save";
        const saveButtonDisabled = !isAuthenticated() ? "disabled" : "";

        recipeCard.innerHTML = `
            <h3>${recipe.title}</h3>
            <img src="${recipe.image}" alt="${recipe.title}" loading="lazy">
            ${ingredientsInfo}
            ${instructionsInfo}
            <div style="margin-top: 1rem;">
                <button class="view-details-button" data-id="${recipe.id}">👁️ View Details</button>
                ${!isFromFavorites ? 
                    `<button class="save-favorite-button" data-id="${recipe.id}" data-title="${recipe.title}" data-image="${recipe.image}" ${saveButtonDisabled}>${saveButtonText}</button>` : 
                    `<button class="remove-favorite-button" data-id="${recipe.id}">🗑️ Remove</button>`
                }
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
        if (!isAuthenticated()) {
            alert("Please log in to view your favorites.");
            window.location.href = "/auth.html";
            return;
        }
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
    const displayFavorites = async () => {
        if (!isAuthenticated()) {
            showEmptyState(favoritesList, "🔒 Login Required", "Please log in to view your favorite recipes.");
            return;
        }

        showLoading(favoritesList, "Loading your favorite recipes...");

        try {
            const response = await makeAuthenticatedRequest("/recipes/all");
            
            if (!response) return; // Token expired, user redirected
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const favorites = data.recipes || [];
            
            favoritesList.innerHTML = "";
            
            if (favorites.length === 0) {
                showEmptyState(favoritesList, "❤️ No Favorites Yet", "Start exploring recipes and save your favorites!");
                return;
            }

            favorites.forEach(recipe => {
                const recipeCard = createRecipeCard(recipe, false, true);
                favoritesList.appendChild(recipeCard);
            });

        } catch (error) {
            console.error("Error fetching favorites:", error);
            showError(favoritesList, "Failed to load your favorites. Please try again.");
        }
    };

    // Event Delegation for Dynamic Buttons
    document.addEventListener("click", async (e) => {
        // View Details Button
        if (e.target.classList.contains("view-details-button")) {
            const recipeId = e.target.getAttribute("data-id");
            await showRecipeDetails(recipeId);
        }

        // Save to Favorites Button
        if (e.target.classList.contains("save-favorite-button")) {
            if (!isAuthenticated()) {
                alert("Please log in to save recipes to favorites.");
                window.location.href = "/auth.html";
                return;
            }

            const button = e.target;
            const recipeId = button.getAttribute("data-id");
            const title = button.getAttribute("data-title");
            const image = button.getAttribute("data-image");
            
            await saveToFavorites(recipeId, title, image, button);
        }

        // Remove from Favorites Button
        if (e.target.classList.contains("remove-favorite-button")) {
            const recipeId = e.target.getAttribute("data-id");
            await removeFromFavorites(recipeId);
        }
    });

    // Save to Favorites Function
    const saveToFavorites = async (recipeId, title, image, button) => {
        const originalText = button.textContent;
        button.textContent = "Saving...";
        button.disabled = true;

        try {
            // First, get detailed recipe information
            const detailsResponse = await fetch(`/recipes/${recipeId}`);
            if (!detailsResponse.ok) {
                throw new Error("Failed to fetch recipe details");
            }
            
            const recipeDetails = await detailsResponse.json();
            
            // Prepare recipe data for saving
            const recipeData = {
                title: title,
                image: image,
                instructions: recipeDetails.instructions || "",
                ingredients: recipeDetails.extendedIngredients ? 
                    recipeDetails.extendedIngredients.map(ing => ing.original) : 
                    (recipeDetails.ingredients || []),
                readyIn: recipeDetails.readyInMinutes || recipeDetails.readyIn,
                spoonacular_id: parseInt(recipeId)
            };

            const response = await makeAuthenticatedRequest("/recipes", {
                method: "POST",
                body: JSON.stringify(recipeData)
            });

            if (!response) return; // Token expired, user redirected

            if (response.ok) {
                button.textContent = "✅ Saved!";
                setTimeout(() => {
                    button.textContent = "❤️ Saved to Favorites";
                    button.disabled = true;
                }, 2000);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to save recipe");
            }

        } catch (error) {
            console.error("Error saving recipe:", error);
            alert(`Failed to save recipe: ${error.message}`);
            button.textContent = originalText;
            button.disabled = false;
        }
    };

    // Remove from Favorites Function
    const removeFromFavorites = async (recipeId) => {
        if (!confirm("Are you sure you want to remove this recipe from your favorites?")) {
            return;
        }

        try {
            const response = await makeAuthenticatedRequest(`/recipes/${recipeId}`, {
                method: "DELETE"
            });

            if (!response) return; // Token expired, user redirected

            if (response.ok) {
                // Refresh favorites display
                displayFavorites();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to remove recipe");
            }

        } catch (error) {
            console.error("Error removing recipe:", error);
            alert(`Failed to remove recipe: ${error.message}`);
        }
    };

    // Show Recipe Details Function
    const showRecipeDetails = async (recipeId) => {
        try {
            const response = await fetch(`/recipes/${recipeId}`);
            
            if (!response.ok) {
                throw new Error("Failed to fetch recipe details");
            }
            
            const recipe = await response.json();
            
            // Populate modal with recipe details
            detailsTitle.textContent = recipe.title;
            detailsImage.src = recipe.image;
            detailsImage.alt = recipe.title;
            detailsSummary.innerHTML = recipe.summary || "No summary available.";
            detailsCookingTime.textContent = recipe.readyInMinutes || recipe.readyIn || "Not specified";
            detailsInstructions.innerHTML = recipe.instructions || "No instructions available.";
            
            // Handle ingredients
            detailsIngredients.innerHTML = "";
            let ingredients = [];
            
            if (recipe.extendedIngredients) {
                ingredients = recipe.extendedIngredients.map(ing => ing.original);
            } else if (recipe.ingredients) {
                ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
            }
            
            ingredients.forEach(ingredient => {
                const li = document.createElement("li");
                li.textContent = ingredient;
                detailsIngredients.appendChild(li);
            });
            
            // Show modal
            recipeDetailsModal.style.display = "block";
            
        } catch (error) {
            console.error("Error fetching recipe details:", error);
            alert("Failed to load recipe details. Please try again.");
        }
    };

    // Modal Close Functionality
    closeButton.addEventListener("click", () => {
        recipeDetailsModal.style.display = "";
    });

    window.addEventListener("click", (e) => {
        if (e.target === recipeDetailsModal) {
            recipeDetailsModal.style.display = "block";
        }
    });

    // Initialize App
    updateAuthUI();
    
    // Check if user came from auth page with success
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success') {
        // Remove the parameter from URL
        window.history.replaceState({}, document.title, window.location.pathname);}})