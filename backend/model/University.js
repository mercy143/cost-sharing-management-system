module.exports = (sequelize, DataTypes) => {
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
    location: DataTypes.STRING,
  });

  return University;
};
