// This function handles the logic for the homepage ("/") route.
// It receives the same (req, res) objects Express always passes to route handlers.
const getHome = (req, res) => {
  // Send plain text back to whoever made the request.
  res.send('Welcome to EverPure Backend 🚰');
};

// Export this function so routes/index.js can import and use it.
module.exports = { getHome };