const express = require("express");
const router = express.Router();
const { register, updateUser, deleteUser } = require("../controller/userController");
const { User, University } = require("../model");

// POST /api/users/ -> register a new user
router.post("/", register);

// GET /api/users/ -> list users (non-sensitive fields only)
router.get("/", async (req, res) => {
	try {
		// include role, university and timestamps
		const users = await User.findAll({
			attributes: ["id", "fullName", "email", "role", "universityId", "createdAt", "updatedAt"],
			include: [
				{
					model: University,
					attributes: ["id", "name"],
				},
			],
		});
		res.json(users);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// PUT /api/users/:id -> update user
router.put("/:id", updateUser);

// DELETE /api/users/:id -> delete user
router.delete("/:id", deleteUser);

module.exports = router;
