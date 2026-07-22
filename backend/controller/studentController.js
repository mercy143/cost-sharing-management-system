const { Student, University } = require("../model");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const APPROVAL_STATUSES = ["pending", "approved", "rejected"];

// 📌 Get all students for logged-in university
exports.getStudents = async (req, res) => {
  try {
    const universityId = req.user.universityId;
    const students = await Student.findAll({ where: { universityId } });
    res.json(students);
  } catch (err) {
    console.error("Get Students Error:", err);
    res.status(500).json({ message: "Error fetching students" });
  }
};

// 📌 Get single student by ID
exports.getStudent = async (req, res) => {
  try {
    const universityId = req.user.universityId;
    const student = await Student.findOne({ where: { id: req.params.id, universityId } });
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (err) {
    console.error("Get Student Error:", err);
    res.status(500).json({ message: "Error fetching student" });
  }
};

// 📌 Create or update a student manually
exports.createOrUpdateStudent = async (req, res) => {
  try {
    const universityId = req.user.universityId;
    const { studentId, fullName, program, totalCost, paidAmount = 0, interestRate = 0.05, approvalStatus } = req.body;

    let student = await Student.findOne({ where: { studentId, universityId } });

    if (student) {
      // Update existing student
      Object.assign(student, { fullName, program, totalCost, paidAmount, interestRate });
    } else {
      // Create new student
      student = Student.build({ studentId, fullName, program, totalCost, paidAmount, interestRate, universityId });
    }

    if (req.user.role !== "admin") {
      student.approvalStatus = "pending";
    } else if (approvalStatus && APPROVAL_STATUSES.includes(approvalStatus)) {
      student.approvalStatus = approvalStatus;
    }

    // Automatically calculate balance and status
    const totalWithInterest = student.totalCost * (1 + student.interestRate);
    student.balance = totalWithInterest - student.paidAmount;
    student.status =
      student.balance <= 0 ? "paid" :
      student.paidAmount > 0 ? "partial" :
      "unpaid";

    await student.save();

    res.status(201).json({ message: "Student saved successfully", student });
  } catch (err) {
    console.error("Create/Update Student Error:", err);
    res.status(500).json({ message: "Error saving student" });
  }
};

// 📌 Delete a student
exports.deleteStudent = async (req, res) => {
  try {
    const universityId = req.user.universityId;
    const studentId = req.params.id;
    const student = await Student.findOne({ where: { id: studentId, universityId } });
    if (!student) return res.status(404).json({ message: "Student not found or not in your university" });

    await student.destroy();
    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    console.error("Delete Student Error:", err);
    res.status(500).json({ message: "Error deleting student" });
  }
};

// 📌 Upload Excel/CSV and create students in bulk
exports.uploadStudents = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const universityId = req.user.universityId;
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    for (const row of data) {
      const { studentId, fullName, program, totalCost, paidAmount = 0, interestRate = 0.05 } = row;

      let student = await Student.findOne({ where: { studentId, universityId } });

      if (student) {
        Object.assign(student, { fullName, program, totalCost, paidAmount, interestRate });
      } else {
        student = Student.build({ studentId, fullName, program, totalCost, paidAmount, interestRate, universityId });
      }

      const totalWithInterest = student.totalCost * (1 + student.interestRate);
      student.balance = totalWithInterest - student.paidAmount;
      student.status =
        student.balance <= 0 ? "paid" :
        student.paidAmount > 0 ? "partial" :
        "unpaid";

      student.approvalStatus = "pending";
      await student.save();
    }

    // Create a Document record for this upload so admins can approve the batch
    try {
      const { Document } = require('../model');
      await Document.create({ fileName: req.file.originalname, fileType: path.extname(req.file.originalname).substring(1), filePath: req.file.path, universityId, uploadedBy: req.user.id, approvalStatus: 'pending' });
    } catch (derr) {
      console.error('Failed to create Document record for upload:', derr);
      // non-fatal; continue
    }
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ message: "Students uploaded successfully" });
  } catch (err) {
    console.error("Upload Students Error:", err);
    res.status(500).json({ message: "Error uploading students" });
  }
};

// 📌 Generate a report of student statuses
exports.getReport = async (req, res) => {
  try {
    const universityId = req.user.universityId;
    const students = await Student.findAll({ where: { universityId } });

    const totalStudents = students.length;
    const paid = students.filter(s => s.status === "paid").length;
    const partial = students.filter(s => s.status === "partial").length;
    const unpaid = students.filter(s => s.status === "unpaid").length;

    res.json({ totalStudents, paid, partial, unpaid });
  } catch (err) {
    console.error("Get Report Error:", err);
    res.status(500).json({ message: "Error generating report" });
  }
};

// 📌 Get pending approvals (admin only)
exports.getPendingStudents = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });

    const { region, universityId } = req.query || {};
    const where = { approvalStatus: "pending" };
    if (universityId && universityId !== "all") where.universityId = universityId;

    const include = [
      {
        model: University,
        attributes: ["id", "name", "location"],
      },
    ];

    if (region && region !== "all") {
      include[0].where = { location: region };
    }

    const students = await Student.findAll({
      where,
      include,
      order: [["createdAt", "DESC"]],
    });

    res.json(students);
  } catch (err) {
    console.error("Get Pending Students Error:", err);
    res.status(500).json({ message: "Error fetching pending students" });
  }
};

// 📌 Update approval status (admin only)
exports.updateApprovalStatus = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    const { id } = req.params;
    const { approvalStatus } = req.body;

    if (!approvalStatus || !APPROVAL_STATUSES.includes(approvalStatus)) {
      return res.status(400).json({ message: "Invalid approval status" });
    }

    const student = await Student.findByPk(id, { include: [{ model: University, attributes: ["name"] }] });
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.approvalStatus = approvalStatus;
    await student.save();

    res.json({ message: `Student ${approvalStatus}`, student });
  } catch (err) {
    console.error("Update Approval Error:", err);
    res.status(500).json({ message: "Error updating approval status" });
  }
};
