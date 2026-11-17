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
  Avatar,
  Grid,
  Paper
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
        occupations: (db.occupations || []).filter((x) => x.id !== id)
      };
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.2 } }}>
      {/* Slim 1-Row Executive Header Bar */}
      <Card
        elevation={0}
        sx={{
          py: { xs: 1.25, sm: 1.5 },
          px: { xs: 1.75, sm: 2.25 },
          mb: 1.75,
          borderRadius: 2.5,
          background: 'linear-gradient(135deg, #0f2e5a 0%, #1e3a8a 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 14px rgba(15, 46, 90, 0.16)'
        }}
      >
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} md={7}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1.8,
                  bgcolor: 'rgba(245, 158, 11, 0.16)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <CategoryIcon sx={{ fontSize: 20, color: '#fbbf24' }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  noWrap
                  sx={{ fontWeight: 800, color: '#ffffff', fontSize: { xs: '0.96rem', sm: '1.06rem' }, lineHeight: 1.2 }}
                >
                  Occupation Master
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ color: '#cbd5e1', display: 'block', fontSize: '0.73rem', mt: 0.15 }}
                >
                  Prabidhik School, Jorpati • Reusable vocational trades (Beautician, Care Giver, Tailoring)
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={5} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} flexWrap="wrap" useFlexGap>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />}
                onClick={handleOpenAdd}
                sx={{
                  bgcolor: '#f59e0b',
                  color: '#0f2e5a',
                  fontWeight: 800,
                  fontSize: '0.76rem',
                  whiteSpace: 'nowrap',
                  px: 1.4,
                  py: 0.65,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#d97706', color: '#ffffff' }
                }}
              >
                + Add Occupation
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead
              sx={{
                bgcolor: '#0F2E5A',
                '& .MuiTableCell-head': {
                  bgcolor: '#0F2E5A !important',
                  color: '#FFFFFF !important',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  py: 1,
                  px: 1.25,
                  borderBottom: '2px solid #F59E0B',
                  whiteSpace: 'nowrap'
                }
              }}
            >
              <TableRow>
                <TableCell>Occupation ID</TableCell>
                <TableCell>Occupation Name</TableCell>
                <TableCell>Associated Courses</TableCell>
                <TableCell>Status</TableCell>
                <TableCell sx={{ textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(db.occupations || []).map((occ) => {
                const courseCount = (db.courses || []).filter((c) => c.occupationId === occ.id).length;
                return (
                  <TableRow key={occ.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: '#1a56b0', fontSize: '0.79rem', whiteSpace: 'nowrap' }}>{occ.id}</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.82rem' }}>{occ.name}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Chip label={`${courseCount} Courses`} size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: '#e8f0fd', color: '#1a56b0', fontWeight: 700 }} />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Chip
                        label={occ.status}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.68rem',
                          bgcolor: occ.status === 'Active' ? '#e5f8ee' : '#fdeceb',
                          color: occ.status === 'Active' ? '#16834b' : '#d5372f',
                          fontWeight: 700
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <IconButton size="small" onClick={() => handleOpenEdit(occ)} sx={{ color: '#1a56b0', p: 0.35 }}>
                        <EditIcon sx={{ fontSize: '1.05rem' }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(occ.id)} sx={{ color: '#d5372f', p: 0.35 }}>
                        <DeleteOutlineIcon sx={{ fontSize: '1.05rem' }} />
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
            alignItems: 'center',
            borderBottom: '3px solid #F59E0B'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', width: 44, height: 44, borderRadius: 2.5 }}>
              <CategoryIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.2 }}>
                {editingItem ? 'Edit Trade' : 'Add Trade'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.72rem' }}>
                Technical Trade & Vocational Sector Management
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            aria-label="Close trade dialog"
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
            p: { xs: 2, sm: 2.5 },
            bgcolor: '#F8FAFC',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-track': { background: '#F1F5F9' },
            '&::-webkit-scrollbar-thumb': { background: '#CBD5E1', borderRadius: 3 },
            '&::-webkit-scrollbar-thumb:hover': { background: '#94A3B8' }
          }}
        >
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
            <Stack spacing={2}>
              <TextField
                label="Occupation Name (e.g. Care Giver)"
                fullWidth
                size="small"
                placeholder="e.g. Care Giver / Beautician / Tailoring"
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
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </TextField>
            </Stack>
          </Paper>
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
            Cancel
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
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
