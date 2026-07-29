document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("loginBtn");
  const loginMessage = document.getElementById("loginMessage");

  if (!loginForm || !usernameInput || !passwordInput || !loginButton || !loginMessage) {
    console.error("Admin login page is missing one or more required elements.");
    return;
  }

  const buttonText = loginButton.querySelector(".btn-text");
  const originalButtonText = buttonText ? buttonText.textContent : "Sign In";

  const showMessage = (message, type = "") => {
    loginMessage.textContent = message;
    loginMessage.className = `message ${type}`.trim();
  };

  const setLoadingState = (isLoading) => {
    loginButton.disabled = isLoading;
    loginButton.classList.toggle("is-loading", isLoading);

    if (buttonText) {
      buttonText.textContent = isLoading ? "Signing In..." : originalButtonText;
    }
  };

  const hasStoredToken = () => Boolean(localStorage.getItem("everpureAdminToken"));

  if (hasStoredToken()) {
    window.location.replace("admin.html");
    return;
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      showMessage("Please enter both username and password.", "error");
      return;
    }

    setLoadingState(true);
    showMessage("");

    try {
      const response = await fetch("http://localhost:3000/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        localStorage.setItem("everpureAdminToken", data.token);
        localStorage.setItem("everpureAdminUsername", username);
        showMessage("Login successful. Redirecting...", "success");

        setTimeout(() => {
          window.location.replace("admin.html");
        }, 1000);
      } else {
        const errorMessage = data.message || "Invalid username or password.";
        showMessage(errorMessage, "error");
      }
    } catch (error) {
      showMessage("Unable to connect to server.", "error");
    } finally {
      setLoadingState(false);
    }
  });
});
