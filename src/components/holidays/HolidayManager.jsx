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
  ToggleButtonGroup,
  Avatar
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
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
    setFormData({
      title: '',
      startDate: '',
      endDate: '',
      type: '',
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
    <Box sx={{ p: { xs: 1.5, sm: 2.2 }, maxWidth: '1440px', mx: 'auto' }}>
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
                <EventBusyIcon sx={{ fontSize: 20, color: '#fbbf24' }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  noWrap
                  sx={{ fontWeight: 800, color: '#ffffff', fontSize: { xs: '0.96rem', sm: '1.06rem' }, lineHeight: 1.2 }}
                >
                  Holiday &amp; Academic Calendar Management
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ color: '#cbd5e1', display: 'block', fontSize: '0.73rem', mt: 0.15 }}
                >
                  Prabidhik School, Jorpati • National, festival &amp; institutional holidays (auto-adjusts Work Plans &amp; End Dates)
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={5} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} flexWrap="wrap" useFlexGap>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileDownloadIcon sx={{ fontSize: '15px !important' }} />}
                onClick={handleExport}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  whiteSpace: 'nowrap',
                  px: 1.4,
                  py: 0.65,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)', borderColor: '#ffffff' }
                }}
              >
                Export Excel
              </Button>
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
                + Add Holiday
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* Saturday Default Notice Box */}
      <Card elevation={0} sx={{ p: 1.25, mb: 1.75, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <CalendarMonthIcon sx={{ color: '#166534', fontSize: 20 }} />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#166534', fontSize: '0.79rem', lineHeight: 1.2 }}>
              Default Saturday Off Policy
            </Typography>
            <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 600, fontSize: '0.71rem' }}>
              In accordance with the official calendar, every Saturday is automatically treated as a non-training day by the system.
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* Compact Filter & View Switcher Bar */}
      <Card
        elevation={0}
        sx={{
          p: 1.25,
          mb: 1.75,
          borderRadius: 2,
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', flexGrow: 1 }}>
            <TextField
              size="small"
              placeholder="Search holiday title, date, type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: { xs: '100%', sm: 300 }, bgcolor: '#ffffff' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                  </InputAdornment>
                )
              }}
            />

            <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap' }}>
              {['All', 'Public Festival', 'National Holiday', 'Institutional'].map((type) => (
                <Chip
                  key={type}
                  label={type}
                  size="small"
                  clickable
                  color={typeFilter === type ? 'primary' : 'default'}
                  onClick={() => setTypeFilter(type)}
                  sx={{ fontWeight: 700, fontSize: '0.74rem' }}
                />
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, fontSize: '0.74rem' }}>
              Showing {filteredHolidays.length} of {totalHolidays}
            </Typography>

            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, next) => next && setViewMode(next)}
              size="small"
              sx={{ bgcolor: '#ffffff' }}
            >
              <ToggleButton value="table" title="Table View" sx={{ py: 0.4, px: 0.9 }}>
                <ViewListIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="card" title="Card View" sx={{ py: 0.4, px: 0.9 }}>
                <ViewModuleIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Card>

      {/* Main Content: Table View vs Card View */}
      {viewMode === 'table' ? (
        <Card elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
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
                  <TableCell sx={{ fontWeight: 800, width: 48, color: '#FFFFFF !important' }}>S.N.</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Holiday Title</TableCell>
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
                    <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem' }}>
                      {idx + 1}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.8rem' }}>
                      {hol.title}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1a56b0', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {hol.startDate}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#16834b', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {hol.endDate}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={hol.type}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.68rem',
                          bgcolor: hol.type.includes('Festival') ? '#fef3c7' : hol.type.includes('National') ? '#e0f2fe' : '#f1f5f9',
                          color: hol.type.includes('Festival') ? '#92400e' : hol.type.includes('National') ? '#0369a1' : '#475569',
                          fontWeight: 700
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#647089', fontSize: '0.76rem' }}>
                      {hol.description || '—'}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <IconButton size="small" onClick={() => handleOpenEdit(hol)} sx={{ color: '#1a56b0', p: 0.4, mr: 0.25 }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(hol.id)} sx={{ color: '#d5372f', p: 0.4 }}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredHolidays.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3.5, color: '#94a3b8', fontSize: '0.8rem' }}>
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
                        DATES:
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
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
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
              <EventBusyIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.2 }}>
                {editingItem ? 'Edit Holiday' : 'Add Holiday Schedule'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.72rem' }}>
                Manage festival, national, or institutional holiday schedules
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
              label="Holiday Title (e.g. Dashain Festival Vacation) *"
              fullWidth
              size="small"
              placeholder="e.g. Dashain Holiday / Tihar Holiday"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="Start Date *"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="End Date *"
                  fullWidth
                  size="small"
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
              size="small"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <MenuItem value="" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                -- Select Holiday Type --
              </MenuItem>
              <MenuItem value="Public Festival">Public Festival</MenuItem>
              <MenuItem value="National Holiday">National Holiday</MenuItem>
              <MenuItem value="Institutional">Institutional / Local</MenuItem>
            </TextField>

            <TextField
              label="Description / Circular Notes"
              multiline
              rows={2}
              fullWidth
              size="small"
              placeholder="Additional notice details or instructions..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
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
            {editingItem ? 'Update Holiday' : 'Save Holiday'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
