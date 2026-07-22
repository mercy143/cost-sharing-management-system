require("dotenv").config();
const bcrypt = require("bcrypt");
const { User } = require("../model");

async function createTestUser() {
  try {
    console.log("🔄 Connecting to database...");
    const { sequelize } = require("../model");
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");

    // Check if admin user exists
    const existingAdmin = await User.findOne({ where: { email: "admin@example.com" } });
    
    if (existingAdmin) {
      console.log("ℹ️  Admin user already exists:");
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Full Name: ${existingAdmin.fullName}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Password is hashed: ${existingAdmin.password.startsWith('$2')}`);
      
      // Update password if it's not hashed
      if (!existingAdmin.password.startsWith('$2')) {
        console.log("🔄 Updating password to hashed version...");
        const hashedPassword = await bcrypt.hash("admin123", 10);
        existingAdmin.password = hashedPassword;
        await existingAdmin.save();
        console.log("✅ Password updated and hashed");
      }
    } else {
      console.log("🔄 Creating admin user...");
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const admin = await User.create({
        email: "admin@example.com",
        fullName: "Admin User",
        password: hashedPassword,
        role: "admin"
      });
      console.log("✅ Admin user created successfully");
    }

    console.log("\n📋 Test User Credentials:");
    console.log("   Email: admin@example.com");
    console.log("   Password: admin123");
    console.log("   Full Name: Admin User (you can also login with this)");
    console.log("\n✅ Test user ready!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to create test user:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

createTestUser();
