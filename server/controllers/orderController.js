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

// Export this function so routes/index.js can import and use it.
module.exports = { createOrder };