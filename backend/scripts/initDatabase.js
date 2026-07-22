require("dotenv").config();
const { sequelize, User, University, Student, Payment, Document } = require("../model");

async function initDatabase() {
  try {
    console.log("🔄 Connecting to database...");
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");

    console.log("🔄 Creating tables...");
    // This will create all tables if they don't exist
    await sequelize.sync({ force: false });
    console.log("✅ Tables created successfully");

    // List all tables
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log(`\n📊 Database tables (${tables.length}):`);
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table}`);
    });

    console.log("\n✅ Database initialization complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    console.error("Full error:", error);
    console.error("\n💡 Please check:");
    console.error("  1. PostgreSQL is running");
    console.error("  2. Database credentials in .env file are correct");
    console.error("  3. Database exists in PostgreSQL");
    process.exit(1);
  }
}

initDatabase();
