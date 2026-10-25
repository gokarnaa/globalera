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
  Avatar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CategoryIcon from '@mui/icons-material/Category';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="xs"
        fullWidth
        BackdropProps={{
          sx: { backdropFilter: 'blur(5px)', bgcolor: 'rgba(15, 23, 42, 0.45)' }
        }}
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            border: '1px solid rgba(226, 232, 240, 0.8)'
          }
        }}
      >
        <DialogTitle
          sx={{
            p: 2.5,
            background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)',
            color: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', width: 44, height: 44, borderRadius: 2.5 }}>
              <CategoryIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.2 }}>
                {editingItem ? 'पेशा समूह सम्पादन (Edit Trade)' : 'नयाँ पेशा समूह दर्ता (Add Trade)'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.72rem' }}>
                प्राविधिक व्यवसाय तथा तालिम विधा व्यवस्थापन
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={() => setOpenDialog(false)}
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF' }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            p: 3,
            bgcolor: '#FFFFFF',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-track': { background: '#F1F5F9' },
            '&::-webkit-scrollbar-thumb': { background: '#CBD5E1', borderRadius: 3 },
            '&::-webkit-scrollbar-thumb:hover': { background: '#94A3B8' }
          }}
        >
          <Stack spacing={2.5}>
            <TextField
              label="Occupation Name (e.g. Care Giver) *"
              fullWidth
              size="small"
              placeholder="उदा: Care Giver / Beautician / Tailoring"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              select
              label="Status"
              fullWidth
              size="small"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <MenuItem value="Active">Active (सक्रिय)</MenuItem>
              <MenuItem value="Inactive">Inactive (निष्क्रिय)</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            p: 2.5,
            bgcolor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1.5
          }}
        >
          <Button
            onClick={() => setOpenDialog(false)}
            sx={{
              fontWeight: 700,
              color: '#64748B',
              border: '1px solid #E2E8F0',
              borderRadius: 2,
              px: 2.5,
              textTransform: 'none',
              '&:hover': { bgcolor: '#F1F5F9', color: '#0F172A' }
            }}
          >
            रद्द गर्नुहोस् (Cancel)
          </Button>
          <Button
            variant="contained"
            startIcon={<CheckCircleIcon />}
            onClick={handleSave}
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)',
              color: '#FFFFFF',
              borderRadius: 2,
              px: 3,
              boxShadow: '0 4px 12px rgba(15, 44, 89, 0.25)',
              textTransform: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #0F2444 0%, #172554 100%)',
                boxShadow: '0 6px 16px rgba(15, 44, 89, 0.35)'
              }
            }}
          >
            सुरक्षित गर्नुहोस् (Save)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
