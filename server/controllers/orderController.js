// Import the Order model so we can create and save new order documents.
const Order = require('../models/Order');

// This function handles creating a new order.
// It's "async" because saving to MongoDB takes time, and we want to
// "await" that operation instead of moving on before it finishes.
const createOrder = async (req, res) => {
  // try/catch lets us handle a successful save and a failed save separately.
  try {
    // req.body contains the data sent by whoever called this route
    // (e.g. a form submission). We read each expected field out of it.
const {
    fullName,
    phone,
    email,
    address,
    bottle19L,
    bottle1_5L,
    bottle500ml,
    deliveryArea,
    deliveryDate,
    deliveryTime,
    notes,
} = req.body;

    // Create a new Order using the Order model.
    // At this point, it only exists in memory — it hasn't been saved
    // to MongoDB yet.
const newOrder = new Order({
    fullName,
    phone,
    email,
    address,
    bottle19L,
    bottle1_5L,
    bottle500ml,
    deliveryArea,
    deliveryDate,
    deliveryTime,
    notes,
});

    // Save the new order to MongoDB.
    // "await" pauses this function until the save either succeeds or fails.
    const savedOrder = await newOrder.save();

    // If we reach this line, the save succeeded.
    // Send back a 201 status code, which means "Created" —
    // the standard status for successfully creating a new resource.
    res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      order: savedOrder,
    });
  } catch (error) {
    // If anything above throws an error (e.g. a required field was
    // missing, or MongoDB couldn't be reached), execution jumps here.

    // Log the actual error to the server's terminal so you (the developer)
    // can see what went wrong — this does NOT get sent to the client.
    console.log(error);

    // Send back a 500 status code, meaning "Internal Server Error" —
    // the standard status for "something went wrong on our end."
    res.status(500).json({
      success: false,
      message: 'Failed to place order.',
    });
  }
};

// This function handles retrieving all orders from MongoDB.
// It is used by the Admin Dashboard to show the full list of orders.
const getAllOrders = async (req, res) => {
  // try/catch lets us handle a successful database fetch and a failed one separately.
  try {
    // Find every order in the database.
    // The sort() call puts the newest orders first by using the createdAt field.
    const orders = await Order.find().sort({ createdAt: -1 });

    // If the database query succeeds, send back a 200 status code.
    // The response includes the total number of orders and the full orders array.
    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    // If anything above throws an error, log it to the terminal.
    console.log(error);

    // Send back a 500 status code when the server cannot fetch the orders.
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders.',
    });
  }
};

// This function handles marking an order as delivered.
// It finds the order by its MongoDB _id, updates its status, and saves it.
const markOrderAsDelivered = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the order in MongoDB by its _id.
    const order = await Order.findById(id);

    // If no order exists for that id, return a 404 response.
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Update the status to Delivered.
    order.status = 'Delivered';

    // Save the updated document.
    const updatedOrder = await order.save();

    // Send back the updated order.
    res.status(200).json({
      success: true,
      message: 'Order marked as delivered.',
      order: updatedOrder,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: 'Failed to update order status.',
    });
  }
};

// This function handles deleting an order by its MongoDB _id.
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the order in MongoDB by its _id.
    const order = await Order.findById(id);

    // If no order exists for that id, return a 404 response.
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Remove the order from MongoDB.
    await Order.findByIdAndDelete(id);

    // Send back a success response.
    res.status(200).json({
      success: true,
      message: 'Order deleted successfully.',
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete order.',
    });
  }
};

// Export these functions so routes/index.js can import and use them.
module.exports = {
  createOrder,
  getAllOrders,
  markOrderAsDelivered,
  deleteOrder,
};