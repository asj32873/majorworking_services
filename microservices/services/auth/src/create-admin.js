require("dotenv").config({
  path: require("path").resolve(__dirname, "../../../.env"),
});

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User"); // adjust if needed

const ADMIN_EMAIL = "admin@shopsphere.com";
const ADMIN_PASSWORD = "admin123";

async function createAdmin() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not configured");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Connected to MongoDB");

    const existingAdmin = await User.findOne({
      email: ADMIN_EMAIL.toLowerCase(),
    }).select("+passwordHash");

    if (existingAdmin) {
      console.log(`User already exists: ${ADMIN_EMAIL}`);

      // Ensure the existing user is an admin
      existingAdmin.role = "ADMIN";
      existingAdmin.status = "ACTIVE";
      existingAdmin.passwordHash = await bcrypt.hash(
        ADMIN_PASSWORD,
        Number(process.env.BCRYPT_SALT_ROUNDS || 12),
      );

      await existingAdmin.save();

      console.log("Existing user updated to ADMIN.");
    } else {
      const passwordHash = await bcrypt.hash(
        ADMIN_PASSWORD,
        Number(process.env.BCRYPT_SALT_ROUNDS || 12),
      );

      const admin = await User.create({
        name: "Administrator",
        email: ADMIN_EMAIL.toLowerCase(),
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
      });

      console.log("Admin created successfully!");
      console.log("ID:", admin._id.toString());
    }

    console.log("Email:", ADMIN_EMAIL);
    console.log("Password:", ADMIN_PASSWORD);
    console.log("Role: ADMIN");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Failed to create admin:", error);

    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

createAdmin();
