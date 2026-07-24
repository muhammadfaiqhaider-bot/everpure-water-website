// Import the Express library so we can use its features in this file.
const express = require('express');

// Import our router from routes/index.js.
// "./routes/index" tells Node to look inside the routes folder for index.js.
const indexRoutes = require('./routes/index');

// Create an Express application. This "app" object represents our server.
const app = express();

// Define the port number our server will listen on.
const PORT = 3000;

// Tell the app to use our router for handling incoming requests.
// Any route defined inside indexRoutes will now be active on this app.
app.use('/', indexRoutes);

// Start the server and make it listen for requests on PORT.
app.listen(PORT, () => {
  // Print a confirmation message in the terminal.
  console.log(`EverPure Server is running on port ${PORT}`);
});