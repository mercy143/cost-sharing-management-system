const express = require("express");
const router = express.Router();
const studentCtrl = require("../controller/studentController");
const multer = require("multer");
const path = require("path");
const { Op } = require("sequelize");
const { Student } = require("../model");

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// ----------------------------
// ROUTES
// ----------------------------

// Search students
router.get("/search", async (req, res) => {
  const { universityId, nationalId, name } = req.query;
  const where = {};

  if (universityId) where.universityId = universityId;
  if (nationalId) where.studentId = nationalId; // mapped to your studentId
  if (name)
    where.fullName = {
      [Op.iLike]: `%${name}%`,
    };

  try {
    const students = await Student.findAll({ where });
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Search failed." });
  }
});

// Get all students
router.get("/", studentCtrl.getStudents);

// Approvals (admin only)
router.get("/approvals/pending", studentCtrl.getPendingStudents);
router.patch("/:id/approval", studentCtrl.updateApprovalStatus);

// Get single student
router.get("/:id", studentCtrl.getStudent);

// Create / update student manually
router.post("/", studentCtrl.createOrUpdateStudent);

// Update by ID
router.put("/:id", studentCtrl.createOrUpdateStudent);

// Delete student
router.delete("/:id", studentCtrl.deleteStudent);

// Upload Excel/CSV file
router.post("/upload", upload.single("file"), studentCtrl.uploadStudents);

// Summary report
router.get("/report/summary", studentCtrl.getReport);

module.exports = router;
