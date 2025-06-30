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

    const createRecipeCard = (recipe, isFromDatabase = true) => {
        const recipeCard = document.createElement("div");
        recipeCard.classList.add("recipe-card", "fade-in");
        
        let ingredientsInfo = "";
        if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
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

        let readyInInfo = "";
        if (recipe.readyin || recipe.readyInMinutes) {
            readyInInfo = `<p><strong>⏱️ Ready in:</strong> ${recipe.readyin || recipe.readyInMinutes} minutes</p>`;
        }

        recipeCard.innerHTML = `
            <h3>${recipe.title}</h3>
            <img src="${recipe.image || '/placeholder-recipe.jpg'}" alt="${recipe.title}" loading="lazy">
            ${ingredientsInfo}
            ${instructionsInfo}
            ${readyInInfo}
            <div style="margin-top: 1rem;">
                <button class="view-details-button" data-id="${recipe.id}">👁️ View Details</button>
                ${isFromDatabase ? `
                    <button class="edit-recipe-button" data-id="${recipe.id}">✏️ Edit</button>
                    <button class="remove-favorite-button" data-id="${recipe.id}">🗑️ Delete</button>
                ` : `
                    <button class="save-favorite-button" data-recipe='${JSON.stringify(recipe)}'>❤️ Save to Favorites</button>
                `}
            </div>
        `;
        
        return recipeCard;
    };

    // Load and display favorites from database
    const displayFavorites = async () => {
        showLoading(favoritesList, "Loading your favorite recipes...");

        try {
            const response = await fetch("/recipes/all");
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const favorites = await response.json();
            
            favoritesList.innerHTML = "";
            
            if (favorites.length === 0) {
                showEmptyState(favoritesList, "❤️ No Favorites Yet", "Start exploring recipes and save your favorites!");
                return;
            }

            favorites.forEach(recipe => {
                const favoriteCard = createRecipeCard(recipe, true);
                favoritesList.appendChild(favoriteCard);
            });

        } catch (error) {
            console.error("Error loading favorites:", error);
            showError(favoritesList, "Failed to load favorite recipes. Please try again.");
        }
    };

    // Save recipe to database
    const saveRecipeToDatabase = async (recipe) => {
        try {
            const response = await fetch("/recipes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: recipe.title,
                    image: recipe.image,
                    instructions: recipe.instructions,
                    ingredients: recipe.ingredients,
                    readyIn: recipe.readyInMinutes || recipe.readyin
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const savedRecipe = await response.json();
            return savedRecipe;
        } catch (error) {
            console.error("Error saving recipe:", error);
            throw error;
        }
    };

    // Update recipe in database
    const updateRecipeInDatabase = async (id, recipeData) => {
        try {
            const response = await fetch(`/recipes/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(recipeData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const updatedRecipe = await response.json();
            return updatedRecipe;
        } catch (error) {
            console.error("Error updating recipe:", error);
            throw error;
        }
    };

    // Delete recipe from database
    const deleteRecipeFromDatabase = async (id) => {
        try {
            const response = await fetch(`/recipes/${id}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error deleting recipe:", error);
            throw error;
        }
    };

    // Event Delegation for Dynamic Buttons
    document.addEventListener("click", async (e) => {
        // Save to Favorites (from external APIs)
        if (e.target.classList.contains("save-favorite-button")) {
            const recipeData = JSON.parse(e.target.dataset.recipe);
            
            try {
                e.target.innerHTML = "💾 Saving...";
                e.target.disabled = true;
                
                await saveRecipeToDatabase(recipeData);
                
                // Visual feedback
                e.target.innerHTML = "✅ Saved!";
                e.target.style.background = "linear-gradient(45deg, #28a745, #20c997)";
                
                setTimeout(() => {
                    displayFavorites(); // Refresh the favorites list
                }, 1000);
                
            } catch (error) {
                e.target.innerHTML = "❌ Failed";
                e.target.style.background = "linear-gradient(45deg, #dc3545, #c82333)";
                setTimeout(() => {
                    e.target.innerHTML = "❤️ Save to Favorites";
                    e.target.style.background = "";
                    e.target.disabled = false;
                }, 2000);
                alert("Failed to save recipe. Please try again.");
            }
        }

        // Remove from Favorites (Delete from database)
        if (e.target.classList.contains("remove-favorite-button")) {
            const recipeId = e.target.dataset.id;
            
            if (confirm("Are you sure you want to delete this recipe from your favorites?")) {
                try {
                    await deleteRecipeFromDatabase(recipeId);
                    displayFavorites(); // Refresh the favorites list
                } catch (error) {
                    alert("Failed to delete recipe. Please try again.");
                }
            }
        }

        // Edit Recipe
        if (e.target.classList.contains("edit-recipe-button")) {
            const recipeId = e.target.dataset.id;
            
            try {
                const response = await fetch(`/recipes/${recipeId}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const recipe = await response.json();

                // Populate edit form
                editRecipeId.value = recipe.id;
                editTitle.value = recipe.title || "";
                editImage.value = recipe.image || "";
                editInstructions.value = recipe.instructions || "";
                editIngredients.value = Array.isArray(recipe.ingredients) ? recipe.ingredients.join("\\n") : "";
                editReadyIn.value = recipe.readyin || "";

                editRecipeModal.style.display = "block";
                document.body.style.overflow = "hidden";

            } catch (error) {
                console.error("Error loading recipe for editing:", error);
                alert("Failed to load recipe details for editing. Please try again.");
            }
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
                detailsImage.src = recipe.image || "/placeholder-recipe.jpg";
                detailsImage.alt = recipe.title;
                detailsSummary.innerHTML = recipe.summary || "No summary available.";
                detailsCookingTime.textContent = recipe.readyin || recipe.readyInMinutes || "Not specified";
                detailsInstructions.innerHTML = recipe.instructions || "No instructions available.";

                detailsIngredients.innerHTML = "";
                if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
                    recipe.ingredients.forEach(ingredient => {
                        const li = document.createElement("li");
                        li.textContent = ingredient;
                        detailsIngredients.appendChild(li);
                    });
                } else if (recipe.extendedIngredients && recipe.extendedIngredients.length > 0) {
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
                document.body.style.overflow = "hidden";

            } catch (error) {
                console.error("Error fetching recipe details:", error);
                alert("Failed to load recipe details. Please try again.");
            }
        }
    });

    // Edit Recipe Form Submission
    editRecipeForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const recipeId = editRecipeId.value;
        const ingredientsArray = editIngredients.value.split("\\n").filter(ing => ing.trim() !== "");
        
        const recipeData = {
            title: editTitle.value.trim(),
            image: editImage.value.trim(),
            instructions: editInstructions.value.trim(),
            ingredients: ingredientsArray,
            readyIn: editReadyIn.value ? parseInt(editReadyIn.value) : null
        };

        try {
            await updateRecipeInDatabase(recipeId, recipeData);
            
            editRecipeModal.style.display = "none";
            document.body.style.overflow = "auto";
            
            displayFavorites(); // Refresh the favorites list
            
        } catch (error) {
            alert("Failed to update recipe. Please try again.");
        }
    });

    // Modal Close Functionality
    closeButton.addEventListener("click", () => {
        recipeDetailsModal.style.display = "none";
        document.body.style.overflow = "auto";
    });

    closeEditButton.addEventListener("click", () => {
        editRecipeModal.style.display = "none";
        document.body.style.overflow = "auto";
    });

    cancelEditButton.addEventListener("click", () => {
        editRecipeModal.style.display = "none";
        document.body.style.overflow = "auto";
    });

    window.addEventListener("click", (e) => {
        if (e.target === recipeDetailsModal) {
            recipeDetailsModal.style.display = "none";
            document.body.style.overflow = "auto";
        }
        if (e.target === editRecipeModal) {
            editRecipeModal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    });

    // Keyboard Navigation
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (recipeDetailsModal.style.display === "block") {
                recipeDetailsModal.style.display = "none";
                document.body.style.overflow = "auto";
            }
            if (editRecipeModal.style.display === "block") {
                editRecipeModal.style.display = "none";
                document.body.style.overflow = "auto";
            }
        }
    });

    // Initialize the favorites page
    displayFavorites();
});

