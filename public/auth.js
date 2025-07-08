document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const loginTab = document.getElementById("login-tab");
    const registerTab = document.getElementById("register-tab");
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const errorMessage = document.getElementById("error-message");
    const successMessage = document.getElementById("success-message");

    // Tab switching functionality
    loginTab.addEventListener("click", () => {
        switchTab("login");
    });

    registerTab.addEventListener("click", () => {
        switchTab("register");
    });

    function switchTab(tab) {
        if (tab === "login") {
            loginTab.classList.add("active");
            registerTab.classList.remove("active");
            loginForm.classList.add("active");
            registerForm.classList.remove("active");
        } else {
            registerTab.classList.add("active");
            loginTab.classList.remove("active");
            registerForm.classList.add("active");
            loginForm.classList.remove("active");
        }
        hideMessages();
    }

    // Utility functions
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = "block";
        successMessage.style.display = "none";
    }

    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = "block";
        errorMessage.style.display = "none";
    }

    function hideMessages() {
        errorMessage.style.display = "none";
        successMessage.style.display = "none";
    }

    function setButtonLoading(button, isLoading) {
        const buttonText = button.querySelector(".button-text");
        const loadingText = button.querySelector(".loading");
        
        if (isLoading) {
            buttonText.style.display = "none";
            loadingText.style.display = "inline";
            button.disabled = true;
        } else {
            buttonText.style.display = "inline";
            loadingText.style.display = "none";
            button.disabled = false;
        }
    }

    // Token management
    function saveToken(token) {
        localStorage.setItem("authToken", token);
    }

    function getToken() {
        return localStorage.getItem("authToken");
    }

    function removeToken() {
        localStorage.removeItem("authToken");
    }

    function saveUser(user) {
        localStorage.setItem("currentUser", JSON.stringify(user));
    }

    function getUser() {
        const user = localStorage.getItem("currentUser");
        return user ? JSON.parse(user) : null;
    }

    function removeUser() {
        localStorage.removeItem("currentUser");
    }

    // Check if user is already logged in
    function checkAuthStatus() {
        const token = getToken();
        const user = getUser();
        
        if (token && user) {
            // Redirect to main page if already logged in
            window.location.href = "/";
        }
    }

    // Login form submission
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const loginButton = document.getElementById("login-button");
        const username = document.getElementById("login-username").value.trim();
        const password = document.getElementById("login-password").value;

        if (!username || !password) {
            showError("Please fill in all fields.");
            return;
        }

        setButtonLoading(loginButton, true);
        hideMessages();

        try {
            const response = await fetch("/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Save token and user data
                saveToken(data.token);
                saveUser(data.user);
                
                showSuccess("Login successful! Redirecting...");
                
                // Redirect to main page after a short delay
                setTimeout(() => {
                    window.location.href = "/";
                }, 1500);
            } else {
                showError(data.error || "Login failed. Please try again.");
            }
        } catch (error) {
            console.error("Login error:", error);
            showError("Network error. Please check your connection and try again.");
        } finally {
            setButtonLoading(loginButton, false);
        }
    });

    // Register form submission
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const registerButton = document.getElementById("register-button");
        const username = document.getElementById("register-username").value.trim();
        const email = document.getElementById("register-email").value.trim();
        const password = document.getElementById("register-password").value;
        const confirmPassword = document.getElementById("register-confirm-password").value;

        // Client-side validation
        if (!username || !email || !password || !confirmPassword) {
            showError("Please fill in all fields.");
            return;
        }

        if (username.length < 3 || username.length > 50) {
            showError("Username must be between 3 and 50 characters long.");
            return;
        }

        if (password.length < 6) {
            showError("Password must be at least 6 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            showError("Passwords do not match.");
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError("Please enter a valid email address.");
            return;
        }

        setButtonLoading(registerButton, true);
        hideMessages();

        try {
            const response = await fetch("/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Save token and user data
                saveToken(data.token);
                saveUser(data.user);
                
                showSuccess("Registration successful! Redirecting...");
                
                // Redirect to main page after a short delay
                setTimeout(() => {
                    window.location.href = "/";
                }, 1500);
            } else {
                showError(data.error || "Registration failed. Please try again.");
            }
        } catch (error) {
            console.error("Registration error:", error);
            showError("Network error. Please check your connection and try again.");
        } finally {
            setButtonLoading(registerButton, false);
        }
    });

    // Password confirmation validation
    document.getElementById("register-confirm-password").addEventListener("input", (e) => {
        const password = document.getElementById("register-password").value;
        const confirmPassword = e.target.value;
        
        if (confirmPassword && password !== confirmPassword) {
            e.target.setCustomValidity("Passwords do not match");
        } else {
            e.target.setCustomValidity("");
        }
    });

    // Check auth status on page load
    checkAuthStatus();
});
