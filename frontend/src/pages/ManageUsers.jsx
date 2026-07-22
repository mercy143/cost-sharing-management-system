import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Select,
  MenuItem,
  DialogActions,
  CircularProgress,
  Alert,
  Stack,
  Toolbar,
  AppBar,
  Tooltip,
  Divider,
  Grid,
  Chip,
  InputAdornment,
  Switch,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  ManageAccounts as ManageAccountsIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import api from "../commonapi/api";
import { useNavigate } from "react-router-dom";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users");
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (user) => {
    setCurrent({ ...user, password: "" });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setCurrent(null);
  };

  const handleSave = async () => {
    if (!current) return;
    setSaving(true);
    setError("");
    try {
      const payload = { fullName: current.fullName, email: current.email, role: current.role };
      if (current.password) payload.password = current.password;
      await api.put(`/users/${current.id}`, payload);
      await fetchUsers();
      closeEdit();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to delete user");
    }
  };

  // sort by createdAt (newest first)
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!search) return sortedUsers;
    const q = search.toLowerCase();
    return sortedUsers.filter((u) =>
      // match fullName, email, role, university name, or id (partial match)
      (u.fullName || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q) ||
      ((u.University && u.University.name) || "").toLowerCase().includes(q) ||
      (u.id !== undefined && u.id !== null && String(u.id).includes(q))
    );
  }, [sortedUsers, search]);

  const headers = [
    "ID",
    "Name of User",
    "Role",
    "University",
    "Username/Email",
    "Created Date",
    "Updated Date",
    "Actions",
  ];

  return (
    <Box sx={{ height: "100vh", width: "100vw", bgcolor: darkMode ? "#121212" : "#f5f7fa", color: darkMode ? "#fff" : "inherit", display: "flex", flexDirection: "column" }}>
      <AppBar position="static" elevation={0} sx={{ background: darkMode ? "linear-gradient(90deg,#333,#555)" : "linear-gradient(90deg,#1976d2,#42a5f5)" }}>
        <Toolbar>
          <ManageAccountsIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>Admin Dashboard</Typography>
          <Tooltip title={darkMode ? "Light Mode" : "Dark Mode"}>
            <Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} color="default" />
          </Tooltip>
          <Button color="inherit" startIcon={<AddCircleOutlineIcon />} onClick={() => navigate("/admin/create-user")}>
            create user
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ px: 4, py: 3 }}>
        <Grid container spacing={3}>
          <Grid xs={12} md={3}>
            <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, borderRadius: 3, bgcolor: "primary.light", color: "primary.contrastText" }}>
              <PersonIcon fontSize="large" />
              <Box>
                <Typography variant="subtitle2">Total Users</Typography>
                <Typography variant="h6">{users.length}</Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid xs={12} md={3}>
            <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, borderRadius: 3, bgcolor: "success.light", color: "success.contrastText" }}>
              <AdminPanelSettingsIcon fontSize="large" />
              <Box>
                <Typography variant="subtitle2">Admins</Typography>
                <Typography variant="h6">{users.filter((u) => u.role === "admin").length}</Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid xs={12} md={3}>
            <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, borderRadius: 3, bgcolor: "info.light", color: "info.contrastText" }}>
              <SchoolIcon fontSize="large" />
              <Box>
                <Typography variant="subtitle2">Universities</Typography>
                <Typography variant="h6">{users.filter((u) => u.role === "university").length}</Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid xs={12} md={3}>
            <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, borderRadius: 3, bgcolor: "warning.light", color: "warning.contrastText" }}>
              <PersonIcon fontSize="large" />
              <Box>
                <Typography variant="subtitle2">Regular Users</Typography>
                <Typography variant="h6">{users.filter((u) => u.role === "user").length}</Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ flexGrow: 1, px: 4, pb: 4, overflow: "auto" }}>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper elevation={6} sx={{ borderRadius: 4, overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: darkMode ? "grey.700" : "#e0e0e0", display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 3, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Registered Users</Typography>
                <Typography variant="body2" color="text.secondary">Manage roles, update details, and remove inactive accounts.</Typography>
              </Box>

              {/* Search placed directly next to the title, centered vertically and responsive */}
              <Box sx={{ ml: { xs: 0, sm: 4 }, alignSelf: 'center', width: { xs: '100%', sm: 360, md: '38%' } }}>
                <TextField
                  fullWidth
                  placeholder="Search by name, email, role, id or university..."
                  variant="outlined"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>

            <TableContainer sx={{ flexGrow: 1 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ backgroundColor: darkMode ? "grey.800" : "#1976d2" }}>
                    {headers.map((h) => (
                      <TableCell key={h} component="th" scope="col" sx={{ color: darkMode ? "#fff" : "white", fontWeight: 600, fontSize: 14, position: "sticky", top: 0, zIndex: 3, backgroundColor: darkMode ? "grey.800" : "#1976d2" }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredUsers.map((u, index) => (
                    <TableRow key={u.id} hover sx={{ backgroundColor: index % 2 === 0 ? (darkMode ? "grey.900" : "grey.50") : (darkMode ? "grey.800" : "grey.100") }}>
                      <TableCell>{u.id}</TableCell>
                      <TableCell>{u.fullName}</TableCell>
                      <TableCell>
                        <Chip label={u.role} color={u.role === "admin" ? "success" : u.role === "university" ? "info" : "warning"} size="small" />
                      </TableCell>
                      <TableCell>{u.University ? u.University.name : (u.universityId || "-")}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}</TableCell>
                      <TableCell>{u.updatedAt ? new Date(u.updatedAt).toLocaleString() : "-"}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Edit">
                            <IconButton onClick={() => openEdit(u)} color="primary" size="small"><EditIcon /></IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton onClick={() => handleDelete(u.id)} color="error" size="small"><DeleteIcon /></IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>

      <Dialog open={editOpen} onClose={closeEdit} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 2 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Edit User</DialogTitle>
        <Divider />
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField fullWidth label="Full Name" value={current?.fullName || ""} onChange={(e) => setCurrent({ ...current, fullName: e.target.value })} />
            <TextField fullWidth label="Email" value={current?.email || ""} onChange={(e) => setCurrent({ ...current, email: e.target.value })} />
            <Select fullWidth value={current?.role || "university"} onChange={(e) => setCurrent({ ...current, role: e.target.value })}>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="university">University</MenuItem>
              <MenuItem value="user">User</MenuItem>
            </Select>
            <TextField fullWidth label="Password (leave blank to keep current)" type="password" value={current?.password || ""} onChange={(e) => setCurrent({ ...current, password: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeEdit} color="inherit">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} variant="contained">{saving ? <CircularProgress size={20} color="inherit" /> : "Save Changes"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
