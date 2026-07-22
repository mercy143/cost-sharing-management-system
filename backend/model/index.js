const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// ========== University MODEL ==========
const University = sequelize.define("University", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  location: {
    type: DataTypes.STRING,
  },
});

// ========== User MODEL ==========
const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: "university", // "admin" | "university"
  },
  // Password reset fields
  resetToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

// ========== Student MODEL ==========
const Student = sequelize.define("Student", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  program: {
    type: DataTypes.STRING,
  },
  nationalId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  graduationYear: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  totalCost: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  paidAmount: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  interestRate: {
    type: DataTypes.FLOAT,
    defaultValue: 0.05, // 5% interest
  },
  balance: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM("paid", "unpaid", "partial"),
    defaultValue: "unpaid",
  },
  approvalStatus: {
    type: DataTypes.ENUM("pending", "approved", "rejected"),
    defaultValue: "pending",
  },
});

// Automatically calculate balance and status before saving
Student.beforeSave((student) => {
  const totalWithInterest = student.totalCost * (1 + student.interestRate);
  const balance = totalWithInterest - student.paidAmount;

  student.balance = balance > 0 ? balance : 0;

  if (balance <= 0) {
    student.status = "paid";
  } else if (student.paidAmount > 0 && balance > 0) {
    student.status = "partial";
  } else {
    student.status = "unpaid";
  }
});

// ========== Payment MODEL ==========
const Payment = sequelize.define("Payment", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  universityId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  paymentDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  method: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "paid",
  },
  interest: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
});

// ========== Document MODEL ==========
const Document = sequelize.define("Document", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fileType: {
    type: DataTypes.STRING, // "csv" or "xlsx"
    allowNull: false,
  },
  filePath: {
    type: DataTypes.STRING, // path on server or URL
    allowNull: false,
  },
  universityId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  uploadedBy: {
    type: DataTypes.INTEGER, // userId
    allowNull: false,
  },
  approvalStatus: {
    type: DataTypes.ENUM("pending", "approved", "rejected"),
    allowNull: false,
    defaultValue: "pending",
  },
});

// ========== ASSOCIATIONS ==========

// User ↔ University
User.belongsTo(University, { foreignKey: "universityId" });
University.hasMany(User, { foreignKey: "universityId" });

// Student ↔ University
University.hasMany(Student, { foreignKey: "universityId" });
Student.belongsTo(University, { foreignKey: "universityId" });

// Student ↔ Payment
Student.hasMany(Payment, { foreignKey: "studentId" });
Payment.belongsTo(Student, { foreignKey: "studentId" });

// Document ↔ University
Document.belongsTo(University, { foreignKey: "universityId" });
University.hasMany(Document, { foreignKey: "universityId" });

// Document ↔ User
Document.belongsTo(User, { foreignKey: "uploadedBy" });
User.hasMany(Document, { foreignKey: "uploadedBy" });

module.exports = { sequelize, User, University, Student, Payment, Document };
