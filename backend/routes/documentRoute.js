const express = require("express");
const router = express.Router();
const multer = require("multer");
const { uploadDocument, getDocuments } = require("../controller/documentController");
const { verifyToken } = require("../middlewares/authMiddleware");

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

router.use(verifyToken);

router.get("/", getDocuments);
router.get("/pending", async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    const docs = await require('../model').Document.findAll({ where: { approvalStatus: 'pending' }, include: [{ model: require('../model').University, attributes: ['id','name'] }], order: [['createdAt','DESC']] });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.post("/", upload.single("file"), uploadDocument);

module.exports = router;
