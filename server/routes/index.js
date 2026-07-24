// Import the Express library — needed here to access Router().
const express = require('express');

// Create a new Router.
const router = express.Router();

// Import the controller functions from indexController.js.
const indexController = require('../controllers/indexController');

// Import the controller functions from orderController.js.
const orderController = require('../controllers/orderController');

// Define the GET route for the homepage ("/").
router.get('/', indexController.getHome);

// Define the POST route for creating a new order.
// When a POST request hits /api/orders, orderController.createOrder runs.
router.post('/api/orders', orderController.createOrder);

// Export this router so server.js can import and use it.
module.exports = router;