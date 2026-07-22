const { Payment, Student } = require("../model");

// 📌 Record a new payment
exports.recordPayment = async (req, res) => {
  try {

    const { studentId, amount, method } = req.body;
    const user = req.user || {};

    // Find student. Admins may record payments for any student; universities only for their own.
    let student;
    if (String(user.role || "").toLowerCase() === "admin") {
      student = await Student.findByPk(studentId);
    } else {
      const universityId = user.universityId;
      student = await Student.findOne({ where: { id: studentId, universityId } });
    }

    if (!student) return res.status(404).json({ message: "Student not found or not in your university" });

    // Add payment record (ensure universityId and method are recorded)
    const payment = await Payment.create({ studentId, universityId: student.universityId, amount, method });

    // Update student's balance and status
    const totalWithInterest = student.totalCost * (1 + student.interestRate);
    student.paidAmount += amount;
    student.balance = totalWithInterest - student.paidAmount;

    student.status =
      student.balance <= 0 ? "paid" :
      student.paidAmount > 0 ? "partial" :
      "unpaid";

    await student.save();

    res.status(201).json({ message: "Payment recorded successfully", payment });
  } catch (error) {
    console.error("Record Payment Error:", error);
    res.status(500).json({ message: "Error recording payment" });
  }
};

// 📌 Get all payments for a student
exports.getPayments = async (req, res) => {
  try {
    const { studentId } = req.params;
    const universityId = req.user.universityId;

    // ✅ Only fetch payments for students in this university
    const student = await Student.findOne({ where: { id: studentId, universityId } });
    if (!student) return res.status(404).json({ message: "Student not found or not in your university" });

    const payments = await Payment.findAll({ where: { studentId } });
    res.json(payments);
  } catch (error) {
    console.error("Get Payments Error:", error);
    res.status(500).json({ message: "Error fetching payments" });
  }
};
