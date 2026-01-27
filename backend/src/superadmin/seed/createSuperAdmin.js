const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const SuperAdmin = require("../../models/superAdminModel");
require("dotenv").config();

async function createSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    const email = "admin@postgen.com"; 
    const password = "SuperAdmin123"; 

    const existing = await SuperAdmin.findOne({ email });
    if (existing) {
      console.log("Super Admin already exists:", email);
      process.exit();
    }

    const password_hash = await bcrypt.hash(password, 10);

    const admin = await SuperAdmin.create({
      email,
      password_hash,
      role: "super_admin",
      status: "active",
    });

    console.log("Super Admin created:");
    console.log("Email:", email);
    console.log("Password:", password);
    process.exit();
  } catch (err) {
    console.error("Error creating super admin:", err);
    process.exit(1);
  }
}

createSuperAdmin();
