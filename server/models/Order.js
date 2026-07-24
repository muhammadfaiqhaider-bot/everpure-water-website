// Import mongoose — needed to define schemas and create models.
const mongoose = require('mongoose');

// A Schema defines the "shape" of a document — what fields it has,
// their types, and any rules (like required or default values).
const orderSchema = new mongoose.Schema(
  {
    // ---------------- Customer Information ----------------

    // Customer's full name — must be provided.
    fullName: {
      type: String,
      required: true,
    },

    // Customer's phone number — must be provided.
    phone: {
      type: String,
      required: true,
    },

    // Customer's email — optional, so no "required" here.
    email: {
      type: String,
    },

    // Delivery address — must be provided.
    address: {
      type: String,
      required: true,
    },

    // ---------------- Products ----------------
    // Each product field stores how many of that item were ordered.
    // Since field names here contain spaces/periods, they're written
    // as quoted strings (normal JS object keys don't allow spaces or
    // periods unless quoted).

    // Number of 19L bottles ordered.
   bottle19L: {
    type: Number,
    default: 0,
},

bottle1_5L: {
    type: Number,
    default: 0,
},

bottle500ml: {
    type: Number,
    default: 0,
},

    // ---------------- Delivery ----------------

    // Which area the order should be delivered to — must be provided.
    deliveryArea: {
      type: String,
      required: true,
    },

    // The date the customer wants delivery — must be provided.
    deliveryDate: {
      type: String,
      required: true,
    },

    // The preferred time slot for delivery — must be provided.
    deliveryTime: {
      type: String,
      required: true,
    },

    // ---------------- Extra ----------------

    // Any additional notes from the customer — optional.
    notes: {
      type: String,
    },

    // ---------------- System ----------------

    // Tracks the current state of the order.
    // Defaults to "Pending" until it's manually updated later
    // (e.g. to "Confirmed", "Delivered", etc.).
    status: {
      type: String,
      default: 'Pending',
    },
  },
  {
    // This automatically adds two fields to every document:
    // createdAt — when the order was first saved
    // updatedAt — when it was last modified
    timestamps: true,
  }
);

// Create the Model from the schema. The first argument, 'Order', is the
// model name — mongoose will automatically create/use a MongoDB collection
// called "orders" (lowercase + pluralized) based on this name.
const Order = mongoose.model('Order', orderSchema);

// Export the model so controllers can import and use it later
// (e.g. to create, read, update, or delete orders).
module.exports = Order;