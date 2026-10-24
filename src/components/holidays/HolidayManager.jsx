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
  Grid,
  Tooltip,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import { loadDB, saveDB, logAudit } from '../../services/storage';
import { exportToExcel } from '../../services/exportUtils';

export default function HolidayManager() {
  const [db, setDb] = useState(loadDB());
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table');

  const [formData, setFormData] = useState({
    title: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    type: 'Public Festival',
    description: ''
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    const today = new Date().toISOString().slice(0, 10);
    setFormData({
      title: '',
      startDate: today,
      endDate: today,
      type: 'Public Festival',
      description: ''
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      startDate: item.startDate,
      endDate: item.endDate,
      type: item.type || 'Public Festival',
      description: item.description || ''
    });
    setOpenDialog(true);
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.startDate || !formData.endDate) {
      alert('Holiday title and date ranges are required.');
      return;
    }

    let updatedList = [...(db.holidays || [])];
    if (editingItem) {
      updatedList = updatedList.map((x) =>
        x.id === editingItem.id ? { ...x, ...formData } : x
      );
      logAudit(db, 'UPDATE_HOLIDAY', 'Holiday', editingItem.id, `Updated holiday: ${formData.title}`);
    } else {
      const newId = `HOL-${String(updatedList.length + 1).padStart(2, '0')}`;
      const newHol = { id: newId, ...formData };
      updatedList.push(newHol);
      logAudit(db, 'CREATE_HOLIDAY', 'Holiday', newId, `Added holiday: ${formData.title} (${formData.startDate} to ${formData.endDate})`);
    }

    const nextDb = { ...db, holidays: updatedList };
    saveDB(nextDb);
    setDb(nextDb);
    setOpenDialog(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this holiday schedule?')) {
      const nextDb = {
        ...db,
        holidays: (db.holidays || []).filter((x) => x.id !== id)
      };
      logAudit(nextDb, 'DELETE_HOLIDAY', 'Holiday', id, `Deleted holiday record ID ${id}`);
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  const handleExport = () => {
    const rows = (db.holidays || []).map((h, i) => ({
      'S.N.': i + 1,
      'Holiday Title': h.title,
      'Start Date': h.startDate,
      'End Date': h.endDate,
      'Type': h.type,
      'Description': h.description
    }));
    exportToExcel(rows, 'TVET_Holidays_Calendar');
  };

  const holidaysList = db.holidays || [];
  const totalHolidays = holidaysList.length;

  const filteredHolidays = holidaysList.filter((h) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (h.title || '').toLowerCase().includes(q) ||
      (h.type || '').toLowerCase().includes(q) ||
      (h.startDate || '').toLowerCase().includes(q) ||
      (h.endDate || '').toLowerCase().includes(q) ||
      (h.description || '').toLowerCase().includes(q);

    const matchesType = typeFilter === 'All' || h.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <Box>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <EventBusyIcon sx={{ color: '#1a56b0', fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#152238' }}>
              Holiday Management (सार्वजनिक तथा संस्थागत बिदा)
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#647089', mt: 0.5 }}>
            National, festival, and institutional holidays. Automatically adjusts Work Plans, Attendance, and Expected End Dates.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleExport} sx={{ fontWeight: 700 }}>
            Export Excel
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd} sx={{ fontWeight: 800 }}>
            + Add Holiday
          </Button>
        </Box>
      </Box>

      {/* Saturday Default Notice Box */}
      <Card sx={{ p: 2, mb: 3, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CalendarMonthIcon sx={{ color: '#166534', fontSize: 28 }} />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#166534' }}>
              शनिबार स्वतः सार्वजनिक बिदा (Default Saturday Off Policy)
            </Typography>
            <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 600 }}>
              नेपालको आधिकारिक कार्यतालिका बमोजिम प्रत्येक शनिबार प्रणालीले स्वतः गैर-प्रशिक्षण दिन (Non-training day) मान्नेछ।
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* Filter & View Switcher Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', flexGrow: 1 }}>
          <TextField
            size="small"
            placeholder="Search holiday title, date, type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: { xs: '100%', sm: 320 }, bgcolor: '#ffffff' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: '#647089' }} />
                </InputAdornment>
              )
            }}
          />

          <Box sx={{ display: 'flex', gap: 0.8 }}>
            {['All', 'Public Festival', 'National Holiday', 'Institutional'].map((type) => (
              <Chip
                key={type}
                label={type}
                clickable
                color={typeFilter === type ? 'primary' : 'default'}
                onClick={() => setTypeFilter(type)}
                sx={{ fontWeight: 700, fontSize: '0.8rem' }}
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body2" sx={{ color: '#647089', fontWeight: 700 }}>
            Showing {filteredHolidays.length} of {totalHolidays}
          </Typography>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, next) => next && setViewMode(next)}
            size="small"
            sx={{ bgcolor: '#ffffff' }}
          >
            <ToggleButton value="table" title="Table View">
              <ViewListIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="card" title="Card View">
              <ViewModuleIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Main Content: Table View vs Card View */}
      {viewMode === 'table' ? (
        <Card sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, width: '70px', color: '#0f172a' }}>क्र.सं. (S.N.)</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Holiday Title (बिदाको शीर्षक)</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Start Date</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>End Date</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredHolidays.map((hol, idx) => (
                  <TableRow key={hol.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>
                      {idx + 1}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>
                      {hol.title}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1a56b0' }}>
                      {hol.startDate}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#16834b' }}>
                      {hol.endDate}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={hol.type}
                        size="small"
                        sx={{
                          bgcolor: hol.type.includes('Festival') ? '#fef3c7' : hol.type.includes('National') ? '#e0f2fe' : '#f1f5f9',
                          color: hol.type.includes('Festival') ? '#92400e' : hol.type.includes('National') ? '#0369a1' : '#475569',
                          fontWeight: 700
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#647089', fontSize: '0.85rem' }}>
                      {hol.description || '—'}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <IconButton size="small" onClick={() => handleOpenEdit(hol)} sx={{ color: '#1a56b0', mr: 0.5 }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(hol.id)} sx={{ color: '#d5372f' }}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredHolidays.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 5, color: '#94a3b8' }}>
                      No holiday schedules found matching the filter criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : (
        /* Card View */
        <Box>
          <Grid container spacing={2.5}>
            {filteredHolidays.map((hol, idx) => (
              <Grid item xs={12} sm={6} md={4} key={hol.id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    p: 2.5,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                      borderColor: '#cbd5e1'
                    }
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Chip
                        label={`#${idx + 1}`}
                        size="small"
                        sx={{ bgcolor: '#0b2545', color: '#ffffff', fontWeight: 800, fontSize: '0.72rem' }}
                      />
                      <Chip
                        label={hol.type}
                        size="small"
                        sx={{
                          bgcolor: hol.type.includes('Festival') ? '#fef3c7' : hol.type.includes('National') ? '#e0f2fe' : '#f1f5f9',
                          color: hol.type.includes('Festival') ? '#92400e' : hol.type.includes('National') ? '#0369a1' : '#475569',
                          fontWeight: 800
                        }}
                      />
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                      {hol.title}
                    </Typography>

                    <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, mb: 1.5, border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: 'block' }}>
                        DATES (अवधि):
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a56b0' }}>
                        {hol.startDate} → {hol.endDate}
                      </Typography>
                    </Box>

                    {hol.description && (
                      <Typography variant="body2" sx={{ color: '#647089', fontSize: '0.85rem' }}>
                        {hol.description}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 1.5, borderTop: '1px solid #f1f5f9' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenEdit(hol)}
                      sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.78rem' }}
                    >
                      Edit
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(hol.id)}
                      sx={{ color: '#d5372f', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Add / Edit Holiday Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingItem ? 'Edit Holiday Schedule' : 'Add New Holiday Schedule'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Holiday Title (e.g. Dashain Festival Vacation)"
              fullWidth
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="Start Date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="End Date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </Grid>
            </Grid>

            <TextField
              select
              label="Holiday Type"
              fullWidth
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <MenuItem value="Public Festival">Public Festival (चाडपर्व बिदा)</MenuItem>
              <MenuItem value="National Holiday">National Holiday (राष्ट्रिय बिदा)</MenuItem>
              <MenuItem value="Institutional">Institutional / Local (संस्थागत बिदा)</MenuItem>
            </TextField>

            <TextField
              label="Description / Circular Notes"
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
            {editingItem ? 'Update Holiday' : 'Save Holiday'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
