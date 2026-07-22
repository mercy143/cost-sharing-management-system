const { Document, University, User } = require("../model");
const path = require("path");
const fs = require("fs");

// Upload document
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const fileName = req.file.originalname;
    const fileType = path.extname(fileName).substring(1);
    const filePath = req.file.path;
    const universityId = req.user.universityId;
    const uploadedBy = req.user.id;

    const document = await Document.create({ fileName, fileType, filePath, universityId, uploadedBy });
    res.status(201).json(document);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List documents for university
exports.getDocuments = async (req, res) => {
  try {
    const universityId = req.user.universityId;
    const documents = await Document.findAll({ where: { universityId } });
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: list pending uploads (documents)
exports.getPendingDocuments = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const docs = await Document.findAll({ where: { approvalStatus: 'pending' }, include: [{ model: University, attributes: ['id','name'] }], order: [['createdAt','DESC']] });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
