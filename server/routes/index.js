// Import the Express library — needed here to access Router().
const express = require('express');

// Create a new Router.
const router = express.Router();

// Import the controller functions from indexController.js.
const indexController = require('../controllers/indexController');

// Define the GET route for the homepage ("/").
// Instead of writing the logic here, we just point to the controller function.
router.get('/', indexController.getHome);

// Export this router so server.js can import and use it.
module.exports = router;