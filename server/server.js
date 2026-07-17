// Import the Express library so we can use its features in this file.
const express = require('express');

// Create an Express application. This "app" object represents our server.
const app = express();

// Define the port number our server will listen on.
const PORT = 3000;

// Create a GET route for the homepage ("/").
// When someone visits http://localhost:3000/, this function runs.
app.get('/', (req, res) => {
  // Send plain text back to whoever made the request.
  res.send('Welcome to EverPure Backend 🚰');
});

// Start the server and make it listen for requests on PORT.
// The second argument is a callback function that runs once the server is ready.
app.listen(PORT, () => {
  // Print a confirmation message in the terminal.
  console.log(`EverPure Server is running on port ${PORT}`);
});