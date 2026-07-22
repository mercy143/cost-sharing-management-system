// backend/model/Student.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Student = sequelize.define("Student", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  universityId: { type: DataTypes.UUID, allowNull: false },

  studentNumber: { type: DataTypes.STRING, allowNull: false }, // unique per uni ideally
  fullName: { type: DataTypes.STRING, allowNull: false },
  nationalId: { type: DataTypes.STRING }, 

  totalFee: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
  amountPaid: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },

  interestRate: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 }, // pct per year
  interestAccrued: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },

  status: { // derived but stored for quick queries: 'paid'|'unpaid'|'partial'
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "unpaid",
  },

  // optional dates
  dueDate: { type: DataTypes.DATEONLY },
  approvalStatus: {
    type: DataTypes.ENUM("pending", "approved", "rejected"),
    allowNull: false,
    defaultValue: "pending",
  },
  note: { type: DataTypes.TEXT }
}, {
  tableName: "students",
  timestamps: true
});

module.exports = Student;
