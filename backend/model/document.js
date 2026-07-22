const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { University, User } = require("./index");

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
});

// ========== Associations ==========
Document.belongsTo(University, { foreignKey: "universityId" });
University.hasMany(Document, { foreignKey: "universityId" });

Document.belongsTo(User, { foreignKey: "uploadedBy" });
User.hasMany(Document, { foreignKey: "uploadedBy" });

module.exports = Document;
