document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const favoritesList = document.getElementById("favorites-list");
    const recipeDetailsModal = document.getElementById("recipe-details-modal");
    const editRecipeModal = document.getElementById("edit-recipe-modal");
    const closeButton = document.querySelector(".close-button");
    const closeEditButton = document.querySelector(".close-edit-button");
    const cancelEditButton = document.getElementById("cancel-edit-button");
    const editRecipeForm = document.getElementById("edit-recipe-form");

    // Modal elements
    const detailsTitle = document.getElementById("details-title");
    const detailsImage = document.getElementById("details-image");
    const detailsSummary = document.getElementById("details-summary");
    const detailsCookingTime = document.getElementById("details-cooking-time");
    const detailsInstructions = document.getElementById("details-instructions");
    const detailsIngredients = document.getElementById("details-ingredients");

    // Edit form elements
    const editRecipeId = document.getElementById("edit-recipe-id");
    const editTitle = document.getElementById("edit-title");
    const editImage = document.getElementById("edit-image");
    const editInstructions = document.getElementById("edit-instructions");
    const editIngredients = document.getElementById("edit-ingredients");
    const editReadyIn = document.getElementById("edit-ready-in");

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
        window.location.href = "/auth.html";
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
            return null;
        }

        return response;
    }

    // Check authentication on page load
    function checkAuth() {
        if (!isAuthenticated()) {
            window.location.href = "/auth.html";
            return false;
        }
        return true;
    }

    // Update header with user info
    function updateAuthUI() {
        const user = getUser();
        const header = document.querySelector("header");
        
        if (user) {
            // Remove existing auth nav if present
            const existingAuthNav = header.querySelector(".auth-nav");
            if (existingAuthNav) {
                existingAuthNav.remove();
            }

            const authNav = document.createElement("div");
            authNav.className = "auth-nav";
            authNav.style.cssText = `
                text-align: center;
                margin-top: 1rem;
                padding-top: 1rem;
                border-top: 1px solid rgba(255, 255, 255, 0.2);
            `;
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
            
            authNav.querySelector("#logout-button").addEventListener("click", logout);
            header.appendChild(authNav);
        }
    }

    // Utility Functions
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

    const createRecipeCard = (recipe) => {
        const recipeCard = document.createElement("div");
        recipeCard.classList.add("recipe-card", "fade-in");
        
        // Handle ingredients display
        let ingredientsDisplay = "";
        if (recipe.ingredients) {
            const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
            ingredientsDisplay = ingredients.slice(0, 3).join(", ");
            if (ingredients.length > 3) {
                ingredientsDisplay += "...";
            }
        }

        // Handle instructions display
        let instructionsDisplay = "";
        if (recipe.instructions) {
            instructionsDisplay = recipe.instructions.length > 150 
                ? recipe.instructions.substring(0, 150) + "..." 
                : recipe.instructions;
        }

        recipeCard.innerHTML = `
            <h3>${recipe.title}</h3>
            <img src="${recipe.image || '/placeholder-recipe.jpg'}" alt="${recipe.title}" loading="lazy">
            ${ingredientsDisplay ? `<p><strong>🥘 Ingredients:</strong> ${ingredientsDisplay}</p>` : ''}
            ${instructionsDisplay ? `<p><strong>📋 Instructions:</strong> ${instructionsDisplay}</p>` : ''}
            ${recipe.readyin ? `<p><strong>⏱️ Ready in:</strong> ${recipe.readyin} minutes</p>` : ''}
            <div style="margin-top: 1rem;">
                <button class="view-details-button" data-id="${recipe.id}">👁️ View Details</button>
                <button class="edit-recipe-button" data-id="${recipe.id}">✏️ Edit</button>
                <button class="delete-recipe-button" data-id="${recipe.id}">🗑️ Delete</button>
            </div>
        `;
        
        return recipeCard;
    };

    // Load and Display Favorites
    const loadFavorites = async () => {
        if (!checkAuth()) return;

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
                showEmptyState(favoritesList, "❤️ No Favorites Yet", "Go back to the main page to search for recipes and save your favorites!");
                return;
            }

            favorites.forEach(recipe => {
                const recipeCard = createRecipeCard(recipe);
                favoritesList.appendChild(recipeCard);
            });

        } catch (error) {
            console.error("Error loading favorites:", error);
            showError(favoritesList, "Failed to load your favorite recipes. Please try again.");
        }
    };

    // Show Recipe Details
    const showRecipeDetails = async (recipeId) => {
        try {
            const response = await makeAuthenticatedRequest(`/recipes/${recipeId}`);
            
            if (!response) return; // Token expired, user redirected
            
            if (!response.ok) {
                throw new Error("Failed to fetch recipe details");
            }
            
            const recipe = await response.json();
            
            // Populate modal with recipe details
            detailsTitle.textContent = recipe.title;
            detailsImage.src = recipe.image || '/placeholder-recipe.jpg';
            detailsImage.alt = recipe.title;
            detailsSummary.innerHTML = recipe.summary || "No summary available.";
            detailsCookingTime.textContent = recipe.readyin || recipe.readyInMinutes || "Not specified";
            detailsInstructions.innerHTML = recipe.instructions || "No instructions available.";
            
            // Handle ingredients
            detailsIngredients.innerHTML = "";
            let ingredients = [];
            
            if (recipe.ingredients) {
                ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
            }
            
            if (ingredients.length === 0) {
                const li = document.createElement("li");
                li.textContent = "No ingredients listed";
                detailsIngredients.appendChild(li);
            } else {
                ingredients.forEach(ingredient => {
                    const li = document.createElement("li");
                    li.textContent = ingredient;
                    detailsIngredients.appendChild(li);
                });
            }
            
            // Show modal
            recipeDetailsModal.style.display = "block";
            
        } catch (error) {
            console.error("Error fetching recipe details:", error);
            alert("Failed to load recipe details. Please try again.");
        }
    };

    // Show Edit Recipe Modal
    const showEditRecipeModal = async (recipeId) => {
        try {
            const response = await makeAuthenticatedRequest(`/recipes/${recipeId}`);
            
            if (!response) return; // Token expired, user redirected
            
            if (!response.ok) {
                throw new Error("Failed to fetch recipe details");
            }
            
            const recipe = await response.json();
            
            // Populate edit form
            editRecipeId.value = recipe.id;
            editTitle.value = recipe.title;
            editImage.value = recipe.image || '';
            editInstructions.value = recipe.instructions || '';
            editReadyIn.value = recipe.readyin || '';
            
            // Handle ingredients
            let ingredientsText = "";
            if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
                ingredientsText = recipe.ingredients.join("\n");
            }
            editIngredients.value = ingredientsText;
            
            // Show modal
            editRecipeModal.style.display = "block";
            
        } catch (error) {
            console.error("Error fetching recipe for editing:", error);
            alert("Failed to load recipe for editing. Please try again.");
        }
    };

    // Update Recipe
    const updateRecipe = async (recipeData) => {
        try {
            const response = await makeAuthenticatedRequest(`/recipes/${recipeData.id}`, {
                method: "PUT",
                body: JSON.stringify(recipeData)
            });

            if (!response) return false; // Token expired, user redirected

            if (response.ok) {
                return true;
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update recipe");
            }

        } catch (error) {
            console.error("Error updating recipe:", error);
            alert(`Failed to update recipe: ${error.message}`);
            return false;
        }
    };

    // Delete Recipe
    const deleteRecipe = async (recipeId) => {
        if (!confirm("Are you sure you want to delete this recipe? This action cannot be undone.")) {
            return;
        }

        try {
            const response = await makeAuthenticatedRequest(`/recipes/${recipeId}`, {
                method: "DELETE"
            });

            if (!response) return; // Token expired, user redirected

            if (response.ok) {
                // Reload favorites
                loadFavorites();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to delete recipe");
            }

        } catch (error) {
            console.error("Error deleting recipe:", error);
            alert(`Failed to delete recipe: ${error.message}`);
        }
    };

    // Event Listeners
    
    // Event delegation for dynamic buttons
    favoritesList.addEventListener("click", (e) => {
        const recipeId = e.target.getAttribute("data-id");
        
        if (e.target.classList.contains("view-details-button")) {
            showRecipeDetails(recipeId);
        } else if (e.target.classList.contains("edit-recipe-button")) {
            showEditRecipeModal(recipeId);
        } else if (e.target.classList.contains("delete-recipe-button")) {
            deleteRecipe(recipeId);
        }
    });

    // Edit form submission
    editRecipeForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const formData = new FormData(editRecipeForm);
        const ingredients = formData.get("ingredients").split("\n").filter(ing => ing.trim() !== "");
        
        const recipeData = {
            id: parseInt(formData.get("id")),
            title: formData.get("title"),
            image: formData.get("image"),
            instructions: formData.get("instructions"),
            ingredients: ingredients,
            readyIn: formData.get("readyIn") ? parseInt(formData.get("readyIn")) : null
        };

        const success = await updateRecipe(recipeData);
        if (success) {
            editRecipeModal.style.display = "none";
            loadFavorites(); // Reload the favorites list
        }
    });

    // Modal close functionality
    closeButton.addEventListener("click", () => {
        recipeDetailsModal.style.display = "none";
    });

    closeEditButton.addEventListener("click", () => {
        editRecipeModal.style.display = "none";
    });

    cancelEditButton.addEventListener("click", () => {
        editRecipeModal.style.display = "none";
    });

    // Close modals when clicking outside
    window.addEventListener("click", (e) => {
        if (e.target === recipeDetailsModal) {
            recipeDetailsModal.style.display = "none";
        }
        if (e.target === editRecipeModal) {
            editRecipeModal.style.display = "none";
        }
    });

    // Initialize
    if (checkAuth()) {
        updateAuthUI();
        loadFavorites();
    }
});
