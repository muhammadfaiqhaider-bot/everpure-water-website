const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Admin = require('./models/Admin');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    await connectDB();

    const existingAdmin = await Admin.findOne({
      username: 'admin'
    });

    if (existingAdmin) {
      console.log('Admin already exists.');
      return;
    }

    const hashedPassword = await bcrypt.hash('everpure123', 10);

    const newAdmin = new Admin({
      username: 'admin',
      password: hashedPassword
    });

    await newAdmin.save();

    console.log('Admin account created successfully.');
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();