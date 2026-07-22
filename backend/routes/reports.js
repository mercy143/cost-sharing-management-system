const express = require("express");
const router = express.Router();
const { Payment, Student, University } = require("../model"); // Sequelize models
const { Op, fn, col, literal } = require("sequelize");
const { verifyToken } = require("../middlewares/authMiddleware");

const buildUniversityFilter = (ids = []) => {
  if (!ids || !ids.length) return null;
  if (ids.length === 1) return ids[0];
  return { [Op.in]: ids };
};

async function resolveUniversityScope(req) {
  const { universityId, region } = req.query || {};

  if (req.user && req.user.role === "university") {
    const record = await University.findByPk(req.user.universityId, {
      attributes: ["id", "name", "location"],
    });
    return {
      ids: record ? [record.id] : [],
      records: record ? [record] : [],
    };
  }

  let universities = await University.findAll({
    attributes: ["id", "name", "location"],
    order: [["name", "ASC"]],
  });

  if (region && region !== "all") {
    const regionLower = region.toLowerCase();
    universities = universities.filter(
      (u) => (u.location || "").toLowerCase() === regionLower
    );
  }

  if (universityId && universityId !== "all") {
    universities = universities.filter((u) => u.id === universityId);
  }

  return { ids: universities.map((u) => u.id), records: universities };
}

// Paid vs Unpaid Summary
router.get("/summary", async (req, res) => {
  try {
    const { university, year } = req.query;

    const whereCondition = {
      paymentDate: {
        [Op.between]: [`${year}-01-01`, `${year}-12-31`],
      },
    };

    if (university && university !== "all") {
      whereCondition.universityId = university;
    }

    const paidCount = await Payment.count({ where: { ...whereCondition, status: "paid" } });
    const unpaidCount = await Payment.count({ where: { ...whereCondition, status: "unpaid" } });

    res.json([
      { name: "Paid", value: paidCount },
      { name: "Unpaid", value: unpaidCount },
    ]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Combined dashboard endpoint returning live aggregates
router.get("/dashboard", verifyToken, async (req, res) => {
  try {
    const scope = await resolveUniversityScope(req);
    if (!scope.ids.length) {
      return res.json({
        summary: { totalPaid: 0, totalUnpaid: 0, interestAccumulated: 0 },
        universityPerformance: [],
        monthlyPayments: [],
      });
    }

    const { year } = req.query || {};
    const parsedYear = year && year !== "all" ? parseInt(year, 10) : null;
    const paymentWhere = {};
    const filterValue = buildUniversityFilter(scope.ids);
    if (filterValue) paymentWhere.universityId = filterValue;

    const totalPaidRow = await Payment.findAll({
      where: { ...paymentWhere, status: "paid" },
      attributes: [[fn("SUM", col("amount")), "totalPaid"]],
    });
    const totalUnpaidRow = await Payment.findAll({
      where: { ...paymentWhere, status: "unpaid" },
      attributes: [[fn("SUM", col("amount")), "totalUnpaid"]],
    });
    const interestRow = await Payment.findAll({
      where: paymentWhere,
      attributes: [[fn("SUM", col("interest")), "totalInterest"]],
    });

    const totalPaid = parseFloat(totalPaidRow[0].get("totalPaid") || 0);
    const totalUnpaid = parseFloat(totalUnpaidRow[0].get("totalUnpaid") || 0);
    const interestAccumulated = parseFloat(interestRow[0].get("totalInterest") || 0);

    const universityPerformance = await Promise.all(
      scope.records.map(async (u) => {
        const paidRow = await Payment.findAll({
          where: { universityId: u.id, status: "paid" },
          attributes: [[fn("SUM", col("amount")), "sumPaid"]],
        });
        const unpaidRow = await Payment.findAll({
          where: { universityId: u.id, status: "unpaid" },
          attributes: [[fn("SUM", col("amount")), "sumUnpaid"]],
        });
        return {
          university: u.name,
          paid: parseFloat(paidRow[0].get("sumPaid") || 0),
          unpaid: parseFloat(unpaidRow[0].get("sumUnpaid") || 0),
        };
      })
    );

    const months = [];
    if (parsedYear) {
      for (let m = 0; m < 12; m++) {
        months.push(`${parsedYear}-${String(m + 1).padStart(2, "0")}`);
      }
    } else {
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      }
    }

    const monthlyPayments = await Promise.all(
      months.map(async (m) => {
        const [yr, month] = m.split("-").map((x) => parseInt(x, 10));
        const start = new Date(yr, month - 1, 1);
        const end = new Date(yr, month, 1);
        const whereDates = { paymentDate: { [Op.gte]: start, [Op.lt]: end } };
        if (filterValue) whereDates.universityId = filterValue;
        const row = await Payment.findAll({
          where: whereDates,
          attributes: [[fn("SUM", col("amount")), "sumAmount"]],
        });
        return { month: m, amount: parseFloat(row[0].get("sumAmount") || 0) };
      })
    );

    res.json({ summary: { totalPaid, totalUnpaid, interestAccumulated }, universityPerformance, monthlyPayments });
  } catch (err) {
    console.error("dashboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Add student-based aggregates so dashboard reflects uploaded students
router.get("/dashboard-students", verifyToken, async (req, res) => {
  try {
    const scope = await resolveUniversityScope(req);
    if (!scope.ids.length) {
      return res.json({
        studentSummary: {
          totalStudents: 0,
          paidStudents: 0,
          unpaidStudents: 0,
          partialStudents: 0,
          totalBalance: 0,
          totalCost: 0,
          totalPaidAmount: 0,
          totalOutstanding: 0,
        },
        universityStudentPerformance: [],
      });
    }

    const where = {};
    const filterValue = buildUniversityFilter(scope.ids);
    if (filterValue) where.universityId = filterValue;

    const totalStudents = await Student.count({ where });
    const paidStudents = await Student.count({ where: { ...where, status: "paid" } });
    const unpaidStudents = await Student.count({ where: { ...where, status: "unpaid" } });
    const partialStudents = await Student.count({ where: { ...where, status: "partial" } });
    const aggregatesRow = await Student.findAll({
      where,
      attributes: [
        [fn("SUM", col("balance")), "totalBalance"],
        [fn("SUM", col("totalCost")), "totalCost"],
        [fn("SUM", col("paidAmount")), "totalPaidAmount"],
      ],
    });
    const totalBalance = parseFloat(aggregatesRow[0].get("totalBalance") || 0);
    const totalCost = parseFloat(aggregatesRow[0].get("totalCost") || 0);
    const totalPaidAmount = parseFloat(aggregatesRow[0].get("totalPaidAmount") || 0);

    const universityStudentPerformance = await Promise.all(
      scope.records.map(async (u) => {
        const baseWhere = { universityId: u.id };
        const total = await Student.count({ where: baseWhere });
        const paid = await Student.count({ where: { ...baseWhere, status: "paid" } });
        const unpaid = await Student.count({ where: { ...baseWhere, status: "unpaid" } });
        const partial = await Student.count({ where: { ...baseWhere, status: "partial" } });
        const sums = await Student.findAll({
          where: baseWhere,
          attributes: [
            [fn("SUM", col("totalCost")), "totalCost"],
            [fn("SUM", col("paidAmount")), "totalPaidAmount"],
            [fn("SUM", col("balance")), "totalOutstanding"],
          ],
        });
        return {
          id: u.id,
          university: u.name,
          total,
          paid,
          unpaid,
          partial,
          totals: {
            totalCost: parseFloat(sums[0].get("totalCost") || 0),
            totalPaidAmount: parseFloat(sums[0].get("totalPaidAmount") || 0),
            totalOutstanding: parseFloat(sums[0].get("totalOutstanding") || 0),
          },
        };
      })
    );

    res.json({
      studentSummary: {
        totalStudents,
        paidStudents,
        unpaidStudents,
        partialStudents,
        totalBalance,
        totalCost,
        totalPaidAmount,
        totalOutstanding: totalBalance,
      },
      universityStudentPerformance,
    });
  } catch (err) {
    console.error("dashboard-students error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Monthly upload trend per university (last 12 months)
router.get("/student-trend", verifyToken, async (req, res) => {
  try {
    const scope = await resolveUniversityScope(req);
    if (!scope.ids.length) {
      return res.json([]);
    }

    const { year } = req.query || {};
    const parsedYear = year && year !== "all" ? parseInt(year, 10) : null;

    const months = [];
    if (parsedYear) {
      for (let m = 0; m < 12; m++) {
        months.push({
          label: `${parsedYear}-${String(m + 1).padStart(2, "0")}`,
          start: new Date(parsedYear, m, 1),
          end: new Date(parsedYear, m + 1, 1),
        });
      }
    } else {
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          label: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
          start: new Date(d.getFullYear(), d.getMonth(), 1),
          end: new Date(d.getFullYear(), d.getMonth() + 1, 1),
        });
      }
    }

    const scoped = {};
    const filterValue = buildUniversityFilter(scope.ids);
    if (filterValue) scoped.universityId = filterValue;

    const trend = await Promise.all(
      months.map(async (m) => {
        const uploads = await Student.count({
          where: {
            ...scoped,
            createdAt: {
              [Op.gte]: m.start,
              [Op.lt]: m.end,
            },
          },
        });
        return { month: m.label, uploads };
      })
    );

    res.json(trend);
  } catch (err) {
    console.error("student-trend error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// University Performance
router.get("/performance", async (req, res) => {
  try {
    const { year } = req.query;

    const data = await Payment.findAll({
      attributes: [
        "universityId",
        [fn("SUM", col("amount")), "total"],
      ],
      where: {
        paymentDate: {
          [Op.between]: [`${year}-01-01`, `${year}-12-31`],
        },
        status: "paid",
      },
      group: ["universityId"],
      include: [{ model: University, attributes: ["name"] }],
    });

    const result = data.map((d) => ({
      university: d.University.name,
      total: parseFloat(d.get("total")),
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Interest Accumulation
router.get("/interest", verifyToken, async (req, res) => {
  try {
    const scope = await resolveUniversityScope(req);
    if (!scope.ids.length) return res.json([]);

    const { year } = req.query || {};
    const parsedYear = year && year !== "all" ? parseInt(year, 10) : new Date().getFullYear();
    const start = new Date(parsedYear, 0, 1);
    const end = new Date(parsedYear + 1, 0, 1);

    const whereCondition = {
      paymentDate: {
        [Op.gte]: start,
        [Op.lt]: end,
      },
    };

    const filterValue = buildUniversityFilter(scope.ids);
    if (filterValue) whereCondition.universityId = filterValue;

    const data = await Payment.findAll({
      attributes: [
        [fn("DATE_TRUNC", "month", col("paymentDate")), "month"],
        [fn("SUM", col("interest")), "interest"],
      ],
      where: whereCondition,
      group: [literal("DATE_TRUNC('month', \"paymentDate\")")],
      order: [literal("DATE_TRUNC('month', \"paymentDate\")")],
    });

    const result = data.map((d) => ({
      month: d.get("month").toISOString().slice(0, 7),
      interest: parseFloat(d.get("interest")),
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;

// Admin endpoint: list universities with aggregated student counts (no heavy student arrays)
router.get("/universities-status", verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });

    const scope = await resolveUniversityScope(req);
    const data =
      scope.records.length > 0
        ? scope.records
        : await University.findAll({ order: [["name", "ASC"]] });
    if (!data.length) return res.json([]);

    // For each university compute counts and totalBalance
    const result = await Promise.all(
      data.map(async (u) => {
        const where = { universityId: u.id };
        const total = await Student.count({ where });
        const paid = await Student.count({ where: { ...where, status: "paid" } });
        const unpaid = await Student.count({ where: { ...where, status: "unpaid" } });
        const partial = await Student.count({ where: { ...where, status: "partial" } });
        const sumsRow = await Student.findAll({
          where,
          attributes: [
            [fn("SUM", col("balance")), "totalBalance"],
            [fn("SUM", col("totalCost")), "totalCost"],
            [fn("SUM", col("paidAmount")), "totalPaidAmount"],
          ],
        });
        const totalBalance = parseFloat((sumsRow[0].get("totalBalance") || 0));
        const totalCost = parseFloat((sumsRow[0].get("totalCost") || 0));
        const totalPaidAmount = parseFloat((sumsRow[0].get("totalPaidAmount") || 0));

        return {
          id: u.id,
          name: u.name,
          location: u.location,
          totalStudents: total,
          paid,
          unpaid,
          partial,
          totalBalance,
          totals: {
            totalCost,
            totalPaidAmount,
            totalOutstanding: totalBalance,
          },
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error("universities-status error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET paginated students for a single university with filters
router.get("/university/:id/students", verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });

    const { id } = req.params;
    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "25");
    const offset = (page - 1) * limit;
    const { search, status } = req.query;

    const where = { universityId: id };
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { studentId: { [Op.iLike]: `%${search}%` } },
        { nationalId: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Student.findAndCountAll({ where, limit, offset, order: [["fullName", "ASC"]] });

    res.json({ total: count, page, pageSize: limit, students: rows });
  } catch (err) {
    console.error("university students error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Export CSV for a university
router.get("/university/:id/export", verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    const { id } = req.params;
    const students = await Student.findAll({ where: { universityId: id }, order: [["fullName", "ASC"]] });

    // build CSV
    const headers = ["studentId", "fullName", "program", "status", "balance", "paidAmount", "interestRate", "graduationYear", "nationalId"];
    const csvRows = [headers.join(",")];
    students.forEach((s) => {
      const row = headers.map((h) => (s[h] != null ? `${String(s[h]).replace(/"/g, '""')}` : "")).join(",");
      csvRows.push(row);
    });

    const csv = csvRows.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=university_${id}_students.csv`);
    res.send(csv);
  } catch (err) {
    console.error("export error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
