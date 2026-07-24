// Import mongoose — the library we use to talk to MongoDB.
const mongoose = require('mongoose');

// Import dotenv so we can read values from the .env file.
const dotenv = require('dotenv');

// Load the variables defined in .env into process.env.
dotenv.config();

// This is an async function because connecting to a database takes time,
// and we want to "wait" for it to finish before moving on.
const connectDB = async () => {
  // try/catch lets us handle a successful connection and a failed one separately.
  try {
    // Attempt to connect to MongoDB using the connection string from .env.
    // "await" pauses this function here until the connection either succeeds or fails.
    await mongoose.connect(process.env.MONGO_URI);

    // This line only runs if the connection above succeeded.
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    // This block runs if mongoose.connect() throws an error.
    console.log(`Error: ${error.message}`);

    // Stop the entire Node process — there's no point running a server
    // that can't reach its database. Exit code 1 signals "something went wrong."
    process.exit(1);
  }
};

// Export this function so server.js can import and call it.
module.exports = connectDB;