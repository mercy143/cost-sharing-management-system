import React, { useState, useContext, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../commonapi/api";
import { AuthContext } from "../commonapi/authContext";

export default function CreateUser() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [universities, setUniversities] = useState([]);
  const [role, setRole] = useState("university");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // ✅ Redirect if not logged in
  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  // ✅ Load universities for dropdown
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const res = await api.get("/universities");
        setUniversities(res.data);
      } catch (err) {
        console.error("Failed to fetch universities:", err);
      }
    };
    fetchUniversities();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
  const payload = { fullName, email, password, universityId, role };
      await api.post("/users", payload);
      setSuccess("User created successfully.");
      setFullName("");
      setEmail("");
      setPassword("");
      setUniversityId("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.message || "Failed to create user.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Paper elevation={6} sx={{ p: 5, width: "100%", maxWidth: 520, borderRadius: 4 }}>
        <Typography variant="h5" fontWeight={700} mb={2}>
          Create New User
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Full Name"
            variant="outlined"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Email"
            variant="outlined"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Password"
            variant="outlined"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />

          <TextField
            select
            fullWidth
            label="University"
            value={universityId}
            onChange={(e) => setUniversityId(e.target.value)}
            margin="normal"
            required
          >
            {universities.map((uni) => (
              <MenuItem key={uni.id} value={uni.id}>
                {uni.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            margin="normal"
            required
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="university">University</MenuItem>
            <MenuItem value="user">User</MenuItem>
          </TextField>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={submitting}
            sx={{ mt: 2, py: 1.2, fontWeight: "bold", borderRadius: 3 }}
          >
            {submitting ? (
              <>
                <CircularProgress size={20} sx={{ color: "white", mr: 1 }} />
                Creating...
              </>
            ) : (
              "Create User"
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
