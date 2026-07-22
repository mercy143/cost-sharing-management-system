const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../model");
const { Op } = require("sequelize");
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// 📌 Register a new user
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, role = "university", universityId } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ fullName, email, password: hashedPassword, role, universityId });

    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Login an existing user
exports.login = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Support login with either email or fullName (username from frontend maps to fullName)
    const identifier = email || username;
    if (!identifier || !password) {
      return res.status(400).json({ message: "Username/email and password are required" });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: { [Op.iLike]: identifier } },
          { fullName: { [Op.iLike]: identifier } }
        ],
      },
    });
    if (!user) {
      console.log(`❌ Login attempt: User not found for identifier: ${identifier}`);
      return res.status(404).json({ message: "User not found" });
    }

    // Check if password is hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
    const isHashed = user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$'));
    
    let isMatch = false;
    if (isHashed) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      // If password is not hashed (legacy data), compare directly (not recommended for production)
      console.warn(`⚠️  User ${user.email} has unhashed password - please update password`);
      isMatch = user.password === password;
    }
    
    if (!isMatch) {
      console.log(`❌ Login attempt failed: Invalid password for user: ${user.email}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, universityId: user.universityId }, // include role + universityId
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      user: { 
        id: user.id, 
        fullName: user.fullName, 
        email: user.email, 
        role: user.role,           // ✅ Important for role-based UI
        universityId: user.universityId  // ✅ Important for student upload filtering
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Handle forgot password requests (minimal and secure - prevents account enumeration)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Always return the same generic response to avoid revealing whether an account exists
    // In a production system you would:
    // - generate a secure, single-use token
    // - save it with an expiry to the DB
    // - send a password reset email with a link containing the token
    // For now, we accept the request and log if a matching user exists (for dev/debug).

    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ where: { email } });
    if (user) {
      // generate a secure token, persist to user with expiry
      const crypto = require("crypto");
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

      user.resetToken = token;
      user.resetExpires = expires;
      await user.save();

      // Try to send an email using nodemailer if configured, otherwise log the link
      try {
        //const nodemailer = require("nodemailer");
        //const transporter = nodemailer.createTransport(process.env.SMTP_URL || "");
        const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

        if (transporter) {
          await transporter.sendMail({
            from: process.env.SMTP_FROM || "no-reply@example.com",
            to: email,
            subject: "Password reset instructions",
            text: `Use the following link to reset your password: ${resetUrl}`,
            html: `<p>Use the following link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
          });
        }

        console.info(`Password reset link for ${email}: ${resetUrl}`);
      } catch (mailErr) {
        // If mailing fails, log the reset link for development.
        console.error("Failed to send reset email, logging reset link instead:", mailErr);
        console.info(`Password reset link for ${email}: ${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${user.resetToken}&email=${encodeURIComponent(email)}`);
      }
    }

    // Respond generically to avoid account enumeration
    res.json({ message: "If an account with that email exists, you will receive password reset instructions shortly." });
  } catch (err) {
    console.error("ForgotPassword Error:", err);
    // Still respond generically on error
    res.status(200).json({ message: "If an account with that email exists, you will receive password reset instructions shortly." });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { token, email, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: "Token and new password are required" });

    // find user with matching token and not expired
    const user = await User.findOne({ where: { resetToken: token, email } });
    if (!user || !user.resetExpires || new Date(user.resetExpires) < new Date()) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // update password
    const hashed = await require("bcrypt").hash(password, 10);
    user.password = hashed;
    user.resetToken = null;
    user.resetExpires = null;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("ResetPassword Error:", err);
    res.status(500).json({ message: "Error resetting password" });
  }
};

// Update user (PUT /api/users/:id)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, password, role } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(400).json({ message: "Email already in use" });
    }

  const updates = { fullName, email };
  if (role) updates.role = role;
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      updates.password = hashed;
    }

    await user.update(updates);
    await user.reload();
    res.json({ message: "User updated", user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete user (DELETE /api/users/:id)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await user.destroy();
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
