// Load environment variables from .env
require('dotenv').config();

// Import the Express library so we can use its features in this file.
const express = require('express');
const cors = require("cors");
const path = require('path');

// Import our router from routes/index.js.
const indexRoutes = require('./routes/index');

// Import the database connection function from config/db.js.
const connectDB = require('./config/db');

// Call the function to connect to MongoDB before anything else runs.
connectDB();

// Create an Express application. This "app" object represents our server.
const app = express();

app.use(cors());

// Define the port number our server will listen on.
const PORT = process.env.PORT || 3000;

// Parse incoming JSON request bodies.
// Without this, req.body will be undefined for POST requests.
app.use(express.json());

// Serve the frontend files from the client folder.
// __dirname is the absolute path to /server, so '..' steps up to the
// project root and then into /client. Static files are checked first;
// anything that isn't a real file falls through to the router below.
app.use(express.static(path.join(__dirname, '..', 'client')));

// Tell the app to use our router for handling incoming requests.
app.use('/', indexRoutes);

// Start the server and make it listen for requests on PORT.
app.listen(PORT, () => {
  // Print a confirmation message in the terminal.
  console.log(`EverPure Server is running on port ${PORT}`);
});