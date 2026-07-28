// Import the Express library — needed here to access Router().
const express = require('express');

// Create a new Router.
const router = express.Router();

// Import the controller functions from indexController.js.
const indexController = require('../controllers/indexController');

// Import the controller functions from orderController.js.
const orderController = require('../controllers/orderController');

// Import the controller functions from adminController.js.
const adminController = require('../controllers/adminController');

// Define the GET route for the homepage ("/").
router.get('/', indexController.getHome);

// Define the GET route for retrieving all orders.
// When a GET request hits /api/orders, orderController.getAllOrders runs.
router.get('/api/orders', orderController.getAllOrders);

// Define the POST route for creating a new order.
// When a POST request hits /api/orders, orderController.createOrder runs.
router.post('/api/orders', orderController.createOrder);

// Define the PUT route for marking an order as delivered.
// When a PUT request hits /api/orders/:id/delivered, orderController.markOrderAsDelivered runs.
router.put('/api/orders/:id/delivered', orderController.markOrderAsDelivered);

// Define the DELETE route for removing an order.
// When a DELETE request hits /api/orders/:id, orderController.deleteOrder runs.
router.delete('/api/orders/:id', orderController.deleteOrder);

// Define the POST route for admin login.
// When a POST request hits /api/admin/login,
// adminController.loginAdmin runs.
router.post('/api/admin/login', adminController.loginAdmin);

// Export this router so server.js can import and use it.
module.exports = router;