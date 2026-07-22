import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fade,
  Divider,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CancelIcon from "@mui/icons-material/Cancel";
import api from "../commonapi/api";
import { AuthContext } from "../commonapi/authContext";

export default function StudentUpload() {
  const { user } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openEdit, setOpenEdit] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get("/students");
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to fetch students.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) return setError("Please select a file first.");
    setUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/students/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(res.data.message || "File uploaded successfully.");
      setFile(null);
      fetchStudents();
      // notify other parts of the app (reports) that students were uploaded
      try { window.dispatchEvent(new CustomEvent('studentsUploaded')); } catch (e) { /* ignore */ }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleCancelUpload = () => {
    setFile(null);
    setError("");
    setSuccess("");
    setUploading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      await api.delete(`/students/${id}`);
      fetchStudents();
      setSuccess("Student deleted successfully.");
      try { window.dispatchEvent(new CustomEvent('studentsUploaded')); } catch (e) { /* ignore */ }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Delete failed.");
    }
  };

  const handleEditOpen = (student) => {
    setEditStudent(student);
    setOpenEdit(true);
  };

  const handleEditClose = () => {
    setOpenEdit(false);
    setEditStudent(null);
  };

  const handleEditSave = async () => {
    if (!editStudent) return;
    setSavingEdit(true);
    try {
      await api.put(`/students/${editStudent.id}`, editStudent);
      fetchStudents();
      handleEditClose();
      setSuccess("Student updated successfully.");
      try { window.dispatchEvent(new CustomEvent('studentsUploaded')); } catch (e) { /* ignore */ }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Update failed.");
    } finally {
      setSavingEdit(false);
    }
  };

  if (!user) return null;

  return (
    <Fade in timeout={700}>
      <Box
        sx={{
          width: "100vw",
          height: "100vh",
          bgcolor: "linear-gradient(to right, #eef2f7, #f8f9fb)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header Section */}
        <Paper
          elevation={4}
          sx={{
            px: 4,
            py: 2,
            borderRadius: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(90deg, #1976d2, #42a5f5)",
            color: "white",
          }}
        >
          <Typography variant="h5" fontWeight="bold">
            🎓 Student Management Dashboard
          </Typography>
          <Typography variant="body2">
            Logged in as: <b>{user?.username || "Admin"}</b>
          </Typography>
        </Paper>

        {/* Upload Section */}
        <Box
          sx={{
            p: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            backgroundColor: "#ffffff",
            boxShadow: 2,
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <Typography variant="h6" fontWeight="600">
            📤 Upload Student Data
          </Typography>
          <Divider />

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              component="label"
              startIcon={<CloudUploadIcon />}
              sx={{
                textTransform: "none",
                background: "linear-gradient(90deg, #1976d2, #42a5f5)",
              }}
            >
              Choose File
              <input type="file" accept=".csv,.xlsx" hidden onChange={handleFileChange} />
            </Button>

            {file && (
              <Typography variant="body2" color="text.secondary">
                Selected: <strong>{file.name}</strong>
              </Typography>
            )}

            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={uploading}
              sx={{
                textTransform: "none",
                background: "linear-gradient(90deg, #2e7d32, #66bb6a)",
              }}
            >
              {uploading ? <CircularProgress size={20} sx={{ color: "white", mr: 1 }} /> : "Upload"}
            </Button>

            {/* ✅ Cancel Upload Button */}
            {file && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={handleCancelUpload}
                sx={{ textTransform: "none" }}
              >
                Cancel Upload
              </Button>
            )}
          </Box>
        </Box>

        {/* Students Table Section */}
        <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
          <Paper
            elevation={3}
            sx={{
              borderRadius: 3,
              height: "100%",
              background: "linear-gradient(180deg, #ffffff, #f4f6f9)",
            }}
          >
            <Box sx={{ p: 2, borderBottom: "1px solid #e5e7eb" }}>
              <Typography variant="h6" fontWeight="600">
                📋 Students List
              </Typography>
            </Box>

            {loading ? (
              <Box textAlign="center" py={5}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: "calc(100vh - 270px)" }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f0f2f5" }}>
                      {[
                          "ID",
                          "University ID",
                          "National ID",
                          "Full Name",
                          "Program",
                          "Graduation Year",
                          "Total Cost",
                          "Paid",
                          "Interest",
                          "Balance",
                          "Unpaid",
                          "Status",
                          "Actions",
                        ].map((header) => (
                        <TableCell
                          key={header}
                          sx={{ fontWeight: 600, color: "#374151" }}
                        >
                          {header}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.length > 0 ? (
                      students.map((s) => {
                        const interest = s.interestRate ?? s.interest ?? 0;
                        const unpaid = s.balance && s.balance > 0 ? s.balance : 0;
                        return (
                        <TableRow
                          key={s.id}
                          hover
                          sx={{
                            "&:hover": {
                              backgroundColor: "#f1f5fb",
                              transition: "0.3s",
                            },
                          }}
                        >
                          <TableCell>{s.studentId}</TableCell>
                          <TableCell>{s.universityId || "-"}</TableCell>
                          <TableCell>{s.nationalId || s.national_id || "-"}</TableCell>
                          <TableCell>{s.fullName}</TableCell>
                          <TableCell>{s.program}</TableCell>
                          <TableCell>{s.graduationYear || s.graduation_year || "-"}</TableCell>
                          <TableCell>{s.totalCost}</TableCell>
                          <TableCell>{s.paidAmount}</TableCell>
                          <TableCell>{typeof interest === 'number' ? `${(interest * 100).toFixed(2)}%` : interest}</TableCell>
                          <TableCell>{s.balance}</TableCell>
                          <TableCell>{unpaid}</TableCell>
                          <TableCell>{s.status}</TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              color="primary"
                              startIcon={<EditIcon />}
                              onClick={() => handleEditOpen(s)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={() => handleDelete(s.id)}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                        )})
                    ) : (
                      <TableRow>
                        <TableCell colSpan={13} align="center">
                          No students found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>

        {/* Edit Dialog */}
        <Dialog
          open={openEdit}
          onClose={handleEditClose}
          fullWidth
          maxWidth="sm"
          PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
        >
          <DialogTitle>Edit Student</DialogTitle>
          <DialogContent dividers>
            {editStudent && (
              <>
                <TextField
                  label="Full Name"
                  fullWidth
                  margin="normal"
                  value={editStudent.fullName}
                  onChange={(e) =>
                    setEditStudent({ ...editStudent, fullName: e.target.value })
                  }
                />
                <TextField
                  label="National ID"
                  fullWidth
                  margin="normal"
                  value={editStudent.nationalId || editStudent.national_id || ""}
                  onChange={(e) =>
                    setEditStudent({ ...editStudent, nationalId: e.target.value })
                  }
                />
                <TextField
                  label="Program"
                  fullWidth
                  margin="normal"
                  value={editStudent.program}
                  onChange={(e) =>
                    setEditStudent({ ...editStudent, program: e.target.value })
                  }
                />
                <TextField
                  label="Total Cost"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={editStudent.totalCost}
                  onChange={(e) =>
                    setEditStudent({
                      ...editStudent,
                      totalCost: parseFloat(e.target.value),
                    })
                  }
                />
                <TextField
                  label="Paid Amount"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={editStudent.paidAmount}
                  onChange={(e) =>
                    setEditStudent({
                      ...editStudent,
                      paidAmount: parseFloat(e.target.value),
                    })
                  }
                />
                <TextField
                  label="Interest Rate"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={editStudent.interestRate || ""}
                  onChange={(e) =>
                    setEditStudent({
                      ...editStudent,
                      interestRate: parseFloat(e.target.value),
                    })
                  }
                />
                <TextField
                  label="Graduation Year"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={editStudent.graduationYear || editStudent.graduation_year || ""}
                  onChange={(e) =>
                    setEditStudent({ ...editStudent, graduationYear: parseInt(e.target.value || "", 10) })
                  }
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditClose}>Cancel</Button>
            <Button
              onClick={handleEditSave}
              variant="contained"
              sx={{ textTransform: "none" }}
              disabled={savingEdit}
            >
              {savingEdit ? <CircularProgress size={20} /> : "Save"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
}
 