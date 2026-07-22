const express = require("express");
const router = express.Router();
const paymentController = require("../controller/paymentController");
const { verifyToken } = require("../middlewares/authMiddleware"); // protect routes

// Apply authentication per-route and add lightweight logging to help diagnose client 404/401 cases.
// POST /api/payments/ → record a new payment
router.post("/", verifyToken, (req, res, next) => {
	try {
		console.debug("[payments] POST received", { user: req.user, bodySample: req.body && Object.keys(req.body).slice(0, 10) });
	} catch (e) { /* ignore logging errors */ }
	return paymentController.recordPayment(req, res, next);
});

// GET /api/payments/:studentId → get all payments for a specific student
// Only accessible if the student belongs to the logged-in user's university
router.get("/:studentId", verifyToken, paymentController.getPayments);

module.exports = router;
