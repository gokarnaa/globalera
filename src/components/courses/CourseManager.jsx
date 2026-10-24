import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { loadDB, saveDB } from '../../services/storage';

export default function CourseManager({ onNavigateToSyllabus }) {
  const [db, setDb] = useState(loadDB());
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    occupationId: '',
    title: '',
    level: 'Level 1',
    durationValue: 3,
    durationUnit: 'Months',
    totalHours: 390,
    price: 15000,
    status: 'Active',
    description: ''
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      occupationId: db.occupations[0]?.id || '',
      title: '',
      level: 'Level 1',
      durationValue: 3,
      durationUnit: 'Months',
      totalHours: 390,
      price: 15000,
      status: 'Active',
      description: ''
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setOpenDialog(true);
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.occupationId) {
      alert('Occupation and Course Title are required.');
      return;
    }

    let updatedList = [...db.courses];
    if (editingItem) {
      updatedList = updatedList.map((x) =>
        x.id === editingItem.id ? { ...x, ...formData } : x
      );
    } else {
      const newId = `CRS-${String(updatedList.length + 1).padStart(2, '0')}`;
      updatedList.push({ id: newId, ...formData });
    }

    const nextDb = { ...db, courses: updatedList };
    saveDB(nextDb);
    setDb(nextDb);
    setOpenDialog(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this course curriculum definition?')) {
      const nextDb = {
        ...db,
        courses: db.courses.filter((x) => x.id !== id)
      };
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <MenuBookIcon sx={{ color: '#1a56b0', fontSize: 30 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#152238' }}>
              Course Master (पाठ्यक्रम)
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#647089', mt: 0.5 }}>
            Curriculum master definitions. Shift, Trainer, and Dates are assigned later in Training Groups.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
          + Add Course
        </Button>
      </Box>

      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Course ID</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Course Title & Level</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Occupation</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Total Hours</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Fee (NPR)</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {db.courses.map((crs) => {
                const occ = db.occupations.find((o) => o.id === crs.occupationId);
                const syllabusCount = (db.syllabi || []).filter((s) => s.courseId === crs.id).length;

                return (
                  <TableRow key={crs.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: '#1a56b0' }}>{crs.id}</TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        {crs.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#647089' }}>
                        {crs.level} • {syllabusCount} Syllabus Units
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={occ?.name || '—'} size="small" sx={{ bgcolor: '#e8f0fd', color: '#1a56b0', fontWeight: 700 }} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {crs.durationValue} {crs.durationUnit}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {crs.totalHours} hrs
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      NPR {Number(crs.price || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={crs.status}
                        size="small"
                        sx={{
                          bgcolor: crs.status === 'Active' ? '#e5f8ee' : '#fdeceb',
                          color: crs.status === 'Active' ? '#16834b' : '#d5372f',
                          fontWeight: 700
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <IconButton size="small" onClick={() => handleOpenEdit(crs)} sx={{ color: '#1a56b0' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(crs.id)} sx={{ color: '#d5372f' }}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingItem ? 'Edit Course Master' : 'Create New Course Master'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              select
              label="Select Occupation"
              fullWidth
              value={formData.occupationId}
              onChange={(e) => setFormData({ ...formData, occupationId: e.target.value })}
              required
            >
              {db.occupations.map((occ) => (
                <MenuItem key={occ.id} value={occ.id}>
                  {occ.name} ({occ.id})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Course Title (e.g. Basic Beautician)"
              fullWidth
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Course Level"
                  fullWidth
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="number"
                  label="Total Training Hours"
                  fullWidth
                  value={formData.totalHours}
                  onChange={(e) => setFormData({ ...formData, totalHours: Number(e.target.value) })}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  type="number"
                  label="Duration Value"
                  fullWidth
                  value={formData.durationValue}
                  onChange={(e) => setFormData({ ...formData, durationValue: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Duration Unit"
                  fullWidth
                  value={formData.durationUnit}
                  onChange={(e) => setFormData({ ...formData, durationUnit: e.target.value })}
                >
                  <MenuItem value="Months">Months</MenuItem>
                  <MenuItem value="Weeks">Weeks</MenuItem>
                  <MenuItem value="Days">Days</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  type="number"
                  label="Course Fee (NPR)"
                  fullWidth
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Status"
                  fullWidth
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <TextField
              label="Description / Curriculum Summary"
              multiline
              rows={2}
              fullWidth
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save Course Master
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
