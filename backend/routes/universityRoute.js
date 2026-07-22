const express = require("express");
const router = express.Router();
const { University } = require("../model");

// GET /api/universities -> list all universities
router.get("/", async (req, res) => {
  try {
    const universities = await University.findAll();
    res.json(universities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch universities" });
  }
});

module.exports = router;
