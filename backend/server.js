require("dotenv").config();
const express = require("express");
const cors = require("cors"); // ✅ Import CORS
const { sequelize } = require("./model");
const userRoutes = require("./routes/userRoute.js");
const authRoutes = require("./routes/authRoute.js");
const studentRoutes = require("./routes/studentRoute");
const { verifyToken } = require("./middlewares/authMiddleware");
const paymentRoutes = require("./routes/paymentRoutes");
const reportRouter = require("./routes/reports");
const documentRoutes = require("./routes/documentRoute");



const app = express();

// ✅ Enable CORS for React Vite (frontend)
const corsOptions = {
  origin: ["http://localhost:5175", "http://localhost:5174","http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(express.json());

// ✅ Request logging middleware (for debugging)
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    console.log(`\n📥 Incoming request: ${req.method} ${req.originalUrl}`);
  }
  next();
});

// ✅ Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// ✅ API routes
try {
  console.log("🔄 Registering API routes...");
  app.use("/api/users", userRoutes);
  console.log("✅ /api/users routes registered");
  
  app.use("/api/auth", authRoutes);
  console.log("✅ /api/auth routes registered");
  
  const universityRoutes = require("./routes/universityRoute");
  app.use("/api/universities", universityRoutes);
  console.log("✅ /api/universities routes registered");
  
  // Debug: Log registered routes
  console.log("\n📋 Registered API routes:");
  console.log("  - POST /api/auth/login");
  console.log("  - POST /api/auth/register");
  console.log("  - POST /api/auth/forgot-password");
  console.log("  - POST /api/auth/reset-password");
  console.log("");
} catch (routeError) {
  console.error("❌ Error registering routes:", routeError);
  throw routeError;
}
// Protect student endpoints: require a valid token so `req.user` is set inside controllers
app.use("/api/students", verifyToken, studentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRouter);
app.use("/api/documents", documentRoutes);

// ✅ 404 handler for unmatched API routes
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    console.log(`\n⚠️  404 - Route not found:`);
    console.log(`   Method: ${req.method}`);
    console.log(`   Path: ${req.originalUrl}`);
    console.log(`   Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
    console.log(`   Registered routes should include: POST /api/auth/login\n`);
    res.status(404).json({ 
      error: "Route not found", 
      method: req.method, 
      path: req.originalUrl,
      availableRoutes: [
        "POST /api/auth/login",
        "POST /api/auth/register",
        "POST /api/auth/forgot-password",
        "POST /api/auth/reset-password"
      ]
    });
  } else {
    next();
  }
});

// ✅ Sync models - create tables if they don't exist
async function syncModels() {
  try {
    console.log("🔄 Syncing database tables...");
    // Sync will create tables if they don't exist
    await sequelize.sync({ force: false });
    console.log("✅ Database tables synced (created if missing)");
    
    // Verify tables were created
    const { User, University, Student, Payment, Document } = require("./model");
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log(`📊 Found ${tables.length} tables in database:`, tables.join(", "));
  } catch (err) {
    // Log the error but do not allow the process to crash here.
    const errorMessage = err && err.message ? err.message : String(err);
    console.error("❌ Table sync error:", errorMessage);
    console.error("Full error:", err);
    
    // If it's a connection error, provide specific guidance
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('timeout')) {
      console.error("❌ Cannot connect to database. Please check:");
      console.error("  1. PostgreSQL is running");
      console.error("  2. Database credentials in .env file are correct");
      console.error("  3. Database exists in PostgreSQL");
    } else if (errorMessage.includes('does not exist') || errorMessage.includes('relation') || errorMessage.includes('table')) {
      console.log("🔄 Attempting to create missing tables...");
      try {
        await sequelize.sync({ force: false });
        console.log("✅ Tables created successfully");
      } catch (createErr) {
        console.error("❌ Failed to create tables:", createErr.message);
        console.warn("⚠️  Server will continue, but database operations may fail.");
      }
    } else if (err && (err.name === 'SequelizeUnknownConstraintError' || errorMessage.includes('constraint'))) {
      console.warn('⚠️  Constraint sync issue detected. This can happen when the DB schema diverged from models.');
      console.warn('💡 Tip: If tables already exist and work correctly, you can ignore this error.');
      console.warn('💡 The server will continue running - existing tables will be used as-is.');
    } else {
      console.warn("⚠️  Database sync failed, but server will continue running.");
      console.warn("💡 You may need to manually create tables or run migrations.");
    }
  }
}

// ✅ Database connection and table creation
sequelize
  .authenticate()
  .then(async () => {
    console.log("✅ Database connected successfully");
    // Sync models after connection is established
    await syncModels();
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err.message);
    console.warn("⚠️  Server will continue, but database operations will fail.");
    console.warn("💡 Please check your database configuration in .env file");
  });

// ✅ Start server (routes are already registered above)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Login endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log(`\n✅ All routes are registered and ready to accept requests!`);
});
