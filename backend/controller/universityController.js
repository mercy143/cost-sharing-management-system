const { University } = require("../model/universityModel");

// ✅ Get all universities
exports.getAllUniversities = async (req, res) => {
  try {
    const universities = await University.findAll();
    res.status(200).json(universities);
  } catch (error) {
    console.error("❌ Error fetching universities:", error);
    res.status(500).json({ message: "Server error while fetching universities" });
  }
};

// ✅ Create a new university
exports.createUniversity = async (req, res) => {
  try {
    const { name, location } = req.body;
    if (!name) {
      return res.status(400).json({ message: "University name is required" });
    }

    const newUniversity = await University.create({ name, location });
    res.status(201).json(newUniversity);
  } catch (error) {
    console.error("❌ Error creating university:", error);
    res.status(500).json({ message: "Server error while creating university" });
  }
};

// ✅ Update a university
exports.updateUniversity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;

    const university = await University.findByPk(id);
    if (!university) return res.status(404).json({ message: "University not found" });

    await university.update({ name, location });
    res.status(200).json(university);
  } catch (error) {
    console.error("❌ Error updating university:", error);
    res.status(500).json({ message: "Server error while updating university" });
  }
};

// ✅ Delete a university
exports.deleteUniversity = async (req, res) => {
  try {
    const { id } = req.params;
    const university = await University.findByPk(id);

    if (!university) return res.status(404).json({ message: "University not found" });

    await university.destroy();
    res.status(200).json({ message: "University deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting university:", error);
    res.status(500).json({ message: "Server error while deleting university" });
  }
};
