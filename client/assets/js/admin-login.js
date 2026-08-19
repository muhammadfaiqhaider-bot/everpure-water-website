document.addEventListener('DOMContentLoaded', () => {
  // Select the login form and its related elements.
  const loginForm = document.querySelector('form');
  const usernameInput = document.querySelector('#username') || document.querySelector('input[name="username"]');
  const passwordInput = document.querySelector('#password') || document.querySelector('input[name="password"]');
  const submitButton = document.querySelector('button[type="submit"]');
  const errorMessageArea = document.querySelector('#error-message') || document.querySelector('.error-message');

  if (!loginForm || !usernameInput || !passwordInput || !submitButton || !errorMessageArea) {
    console.error('Admin login form elements were not found.');
    return;
  }

  // Handle form submission.
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Clear any previous error message.
    errorMessageArea.textContent = '';

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Validate required fields.
    if (!username || !password) {
      errorMessageArea.textContent = 'Please enter both username and password.';
      return;
    }

    // Disable the button and show a loading state.
    submitButton.disabled = true;
    submitButton.textContent = 'Signing in...';

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Save the JWT token for future admin requests.
        localStorage.setItem('everpureAdminToken', data.token);

        // Redirect to the admin dashboard.
        window.location.href = 'admin.html';
        return;
      }

      // Show the backend error message.
      errorMessageArea.textContent = data.message || 'Login failed. Please try again.';
    } catch (error) {
      // Handle network or fetch-related issues.
      errorMessageArea.textContent = 'Unable to connect to the server. Please try again.';
      console.error('Admin login error:', error);
    } finally {
      // Re-enable the button after the request finishes.
      submitButton.disabled = false;
      submitButton.textContent = 'Login';
    }
  });
});
