// backend/model/Payment.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Payment = sequelize.define("Payment", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  studentId: { type: DataTypes.UUID, allowNull: false },
  universityId: { type: DataTypes.UUID, allowNull: false },

  amount: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  method: { type: DataTypes.STRING }, // cash, transfer, mobile, etc.
  paidAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },

  note: { type: DataTypes.TEXT }
}, {
  tableName: "payments",
  timestamps: true
});

module.exports = Payment;
