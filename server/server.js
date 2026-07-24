// Import the Express library so we can use its features in this file.
const express = require('express');

// Import our router from routes/index.js.
const indexRoutes = require('./routes/index');

// Import the database connection function from config/db.js.
const connectDB = require('./config/db');

// Call the function to connect to MongoDB before anything else runs.
connectDB();

// Create an Express application. This "app" object represents our server.
const app = express();

// Define the port number our server will listen on.
const PORT = 3000;

// Tell the app to use our router for handling incoming requests.
app.use('/', indexRoutes);

// Start the server and make it listen for requests on PORT.
app.listen(PORT, () => {
  // Print a confirmation message in the terminal.
  console.log(`EverPure Server is running on port ${PORT}`);
});