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
  Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CategoryIcon from '@mui/icons-material/Category';
import { loadDB, saveDB } from '../../services/storage';

export default function OccupationManager() {
  const [db, setDb] = useState(loadDB());
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', status: 'Active' });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', status: 'Active' });
    setOpenDialog(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({ name: item.name, status: item.status });
    setOpenDialog(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Occupation name is required.');
      return;
    }

    let updatedList = [...db.occupations];
    if (editingItem) {
      updatedList = updatedList.map((x) =>
        x.id === editingItem.id ? { ...x, ...formData } : x
      );
    } else {
      const newId = `OCC-${String(updatedList.length + 1).padStart(2, '0')}`;
      updatedList.push({ id: newId, ...formData });
    }

    const nextDb = { ...db, occupations: updatedList };
    saveDB(nextDb);
    setDb(nextDb);
    setOpenDialog(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this occupation?')) {
      const nextDb = {
        ...db,
        occupations: db.occupations.filter((x) => x.id !== id)
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
            <CategoryIcon sx={{ color: '#1a56b0', fontSize: 30 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#152238' }}>
              Occupation Master (पेशा)
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#647089', mt: 0.5 }}>
            Reusable vocational trades (e.g. Beautician, Care Giver, Tailoring). Courses and Trainers link here.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
          + Add Occupation
        </Button>
      </Box>

      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Occupation ID</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Occupation Name</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Associated Courses</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {db.occupations.map((occ) => {
                const courseCount = (db.courses || []).filter((c) => c.occupationId === occ.id).length;
                return (
                  <TableRow key={occ.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: '#1a56b0' }}>{occ.id}</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{occ.name}</TableCell>
                    <TableCell>
                      <Chip label={`${courseCount} Courses`} size="small" sx={{ bgcolor: '#e8f0fd', color: '#1a56b0', fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={occ.status}
                        size="small"
                        sx={{
                          bgcolor: occ.status === 'Active' ? '#e5f8ee' : '#fdeceb',
                          color: occ.status === 'Active' ? '#16834b' : '#d5372f',
                          fontWeight: 700
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <IconButton size="small" onClick={() => handleOpenEdit(occ)} sx={{ color: '#1a56b0' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(occ.id)} sx={{ color: '#d5372f' }}>
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
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingItem ? 'Edit Occupation' : 'Add New Occupation'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Occupation Name (e.g. Care Giver)"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
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
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save Occupation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
