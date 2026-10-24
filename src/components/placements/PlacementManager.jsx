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
  Avatar,
  Tooltip,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import WorkIcon from '@mui/icons-material/Work';
import PersonIcon from '@mui/icons-material/Person';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { loadDB, saveDB } from '../../services/storage';
import { getWhatsAppUrl } from '../../services/exportUtils';

export default function PlacementManager() {
  const [db, setDb] = useState(loadDB());
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table');

  const [formData, setFormData] = useState({
    studentId: db.students[0]?.id || '',
    employerId: db.employers[0]?.id || '',
    targetJob: '',
    preferredLocation: 'Kathmandu',
    expectedSalary: 'NPR 25,000 / month',
    employmentType: 'Full-Time Employee',
    workSchedule: 'Day Shift',
    paymentType: 'Monthly Salary',
    status: 'Planned',
    remarks: ''
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      studentId: db.students[0]?.id || '',
      employerId: db.employers[0]?.id || '',
      targetJob: 'Geriatric Caregiver Specialist',
      preferredLocation: 'Kathmandu',
      expectedSalary: 'NPR 25,000 / month',
      employmentType: 'Full-Time Employee',
      workSchedule: 'Day Shift',
      paymentType: 'Monthly Salary',
      status: 'Planned',
      remarks: ''
    });
    setOpenDialog(true);
  };

  const handleSave = () => {
    if (!formData.studentId || !formData.targetJob.trim()) {
      alert('Student and Target Job Title are required.');
      return;
    }

    let updatedList = [...db.placements];
    if (editingItem) {
      updatedList = updatedList.map((x) =>
        x.id === editingItem.id ? { ...x, ...formData } : x
      );
    } else {
      const newId = `PLC-${String(updatedList.length + 1).padStart(2, '0')}`;
      updatedList.push({ id: newId, ...formData });

      // Add to Student Timeline
      const std = db.students.find((s) => s.id === formData.studentId);
      const emp = db.employers.find((e) => e.id === formData.employerId);
      db.studentTimelines.unshift({
        id: `TL-${Date.now()}`,
        studentId: formData.studentId,
        eventType: 'Placement',
        title: `Placement Created: ${formData.targetJob}`,
        description: `Company: ${emp?.name || 'Partner'}, Expected Salary: ${formData.expectedSalary}, Status: ${formData.status}`,
        createdAt: new Date().toISOString()
      });
    }

    const nextDb = { ...db, placements: updatedList };
    saveDB(nextDb);
    setDb(nextDb);
    setOpenDialog(false);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      studentId: item.studentId,
      employerId: item.employerId || '',
      targetJob: item.targetJob || '',
      preferredLocation: item.preferredLocation || 'Kathmandu',
      expectedSalary: item.expectedSalary || '',
      employmentType: item.employmentType || 'Full-Time Employee',
      workSchedule: item.workSchedule || 'Day Shift',
      paymentType: item.paymentType || 'Monthly Salary',
      status: item.status || 'Planned',
      remarks: item.remarks || ''
    });
    setOpenDialog(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this placement plan?')) {
      const nextDb = {
        ...db,
        placements: db.placements.filter((x) => x.id !== id)
      };
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  const totalPlacements = (db.placements || []).length;
  const placedCount = (db.placements || []).filter((p) => p.status === 'Placed').length;
  const plannedCount = (db.placements || []).filter((p) => p.status === 'Planned').length;
  const ongoingCount = (db.placements || []).filter((p) => p.status === 'Ongoing').length;

  const filteredPlacements = (db.placements || []).filter((plc) => {
    const std = db.students.find((s) => s.id === plc.studentId);
    const emp = db.employers.find((e) => e.id === plc.employerId);
    const q = searchTerm.toLowerCase();

    const matchesSearch =
      !searchTerm ||
      (std?.name || '').toLowerCase().includes(q) ||
      (std?.tgid || '').toLowerCase().includes(q) ||
      (plc.targetJob || '').toLowerCase().includes(q) ||
      (emp?.name || '').toLowerCase().includes(q) ||
      (plc.preferredLocation || '').toLowerCase().includes(q) ||
      (plc.expectedSalary || '').toLowerCase().includes(q) ||
      (plc.employmentType || '').toLowerCase().includes(q) ||
      (plc.id || '').toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'All' || plc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <RocketLaunchIcon sx={{ color: '#1a56b0', fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#152238' }}>
              Placements & Employment (EPP)
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#647089', mt: 0.5 }}>
            Final TVET outcome tracking: Target Job, Host Employer, Expected Salary, and Contract Status.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd} sx={{ fontWeight: 800 }}>
          + Create Placement Plan
        </Button>
      </Box>

      {/* KPI Summary Cards */}
      <Card sx={{ p: 2, mb: 3, bgcolor: '#ffffff', borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f8fafc', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: 'block' }}>
                TOTAL CANDIDATES
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a' }}>
                {totalPlacements}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f0fdf4', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700, display: 'block' }}>
                PLACED & EMPLOYED
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#15803d' }}>
                {placedCount} Graduates
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#eff6ff', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 700, display: 'block' }}>
                PLANNED (PIPELINE)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#1d4ed8' }}>
                {plannedCount} Candidates
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#fefce8', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#854d0e', fontWeight: 700, display: 'block' }}>
                ONGOING TRIAL
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#a16207' }}>
                {ongoingCount} Candidates
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* Filter & View Switcher Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', flexGrow: 1 }}>
          <TextField
            size="small"
            placeholder="Search student, job title, employer, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: { xs: '100%', sm: 340 }, bgcolor: '#ffffff' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: '#647089' }} />
                </InputAdornment>
              )
            }}
          />

          <Box sx={{ display: 'flex', gap: 0.8 }}>
            {['All', 'Placed', 'Planned', 'Ongoing'].map((st) => (
              <Chip
                key={st}
                label={st}
                clickable
                color={statusFilter === st ? 'primary' : 'default'}
                onClick={() => setStatusFilter(st)}
                sx={{ fontWeight: 700, fontSize: '0.8rem' }}
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body2" sx={{ color: '#647089', fontWeight: 700 }}>
            Showing {filteredPlacements.length} of {totalPlacements}
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
                  <TableCell sx={{ fontWeight: 800 }}>Student Candidate</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Target Job Title</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Employer Partner</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Expected Salary & Terms</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Employment Type</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPlacements.map((plc, idx) => {
                  const std = db.students.find((s) => s.id === plc.studentId);
                  const emp = db.employers.find((e) => e.id === plc.employerId);

                  return (
                    <TableRow key={plc.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar src={std?.photoUrl} sx={{ width: 38, height: 38, bgcolor: '#1a56b0', fontWeight: 700 }}>
                            {std?.name?.[0] || 'S'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                              {std?.name || 'Student'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#647089' }}>
                              {std?.tgid}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#152238' }}>
                        {plc.targetJob}
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {emp?.name || 'Self-Employed / Freelance'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#647089' }}>
                          {plc.preferredLocation}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#16834b' }}>
                          {plc.expectedSalary}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#647089' }}>
                          {plc.paymentType}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={plc.employmentType} size="small" sx={{ bgcolor: '#f1f5f9', fontWeight: 700 }} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<CheckCircleIcon />}
                          label={plc.status}
                          size="small"
                          sx={{
                            bgcolor: plc.status === 'Placed' ? '#e5f8ee' : plc.status === 'Ongoing' ? '#fdf3e2' : '#e8f0fd',
                            color: plc.status === 'Placed' ? '#16834b' : plc.status === 'Ongoing' ? '#c9820a' : '#1a56b0',
                            fontWeight: 700
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        <IconButton size="small" onClick={() => handleOpenEdit(plc)} sx={{ color: '#1a56b0', mr: 0.5 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(plc.id)} sx={{ color: '#d5372f' }}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredPlacements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 5, color: '#94a3b8' }}>
                      No placement records found matching the filter criteria.
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
            {filteredPlacements.map((plc, idx) => {
              const std = db.students.find((s) => s.id === plc.studentId);
              const emp = db.employers.find((e) => e.id === plc.employerId);

              return (
                <Grid item xs={12} sm={6} md={4} key={plc.id}>
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={`#${idx + 1}`}
                            size="small"
                            sx={{ bgcolor: '#0b2545', color: '#ffffff', fontWeight: 800, fontSize: '0.72rem' }}
                          />
                          <Chip
                            label={plc.id}
                            size="small"
                            sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: '0.72rem' }}
                          />
                        </Box>
                        <Chip
                          icon={<CheckCircleIcon />}
                          label={plc.status}
                          size="small"
                          sx={{
                            bgcolor: plc.status === 'Placed' ? '#e5f8ee' : plc.status === 'Ongoing' ? '#fdf3e2' : '#e8f0fd',
                            color: plc.status === 'Placed' ? '#16834b' : plc.status === 'Ongoing' ? '#c9820a' : '#1a56b0',
                            fontWeight: 800
                          }}
                        />
                      </Box>

                      {/* Candidate Row */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.2, bgcolor: '#f8fafc', borderRadius: 2, mb: 1.8 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar src={std?.photoUrl} sx={{ width: 44, height: 44, bgcolor: '#1a56b0', fontWeight: 800 }}>
                            {std?.name?.[0] || 'S'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                              {std?.name || 'Candidate'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: 'block' }}>
                              TGID: {std?.tgid}
                            </Typography>
                          </Box>
                        </Box>
                        {std?.phone && (
                          <IconButton
                            size="small"
                            component="a"
                            href={getWhatsAppUrl(std.phone, `Namaste ${std.name}, greetings regarding your career placement.`)}
                            target="_blank"
                            sx={{
                              bgcolor: '#25D366',
                              color: '#ffffff',
                              p: '5px',
                              '&:hover': { bgcolor: '#1ebc59' }
                            }}
                          >
                            <WhatsAppIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        )}
                      </Box>

                      {/* Target Job Title */}
                      <Box sx={{ mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5 }}>
                          <WorkIcon sx={{ fontSize: 18, color: '#1a56b0' }} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#152238' }}>
                            {plc.targetJob}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.8, pl: 3.2 }}>
                          <Chip label={plc.employmentType} size="small" sx={{ bgcolor: '#f1f5f9', fontWeight: 700, fontSize: '0.72rem' }} />
                          <Chip label={plc.workSchedule} size="small" sx={{ bgcolor: '#f8fafc', fontWeight: 600, fontSize: '0.72rem' }} />
                        </Box>
                      </Box>

                      {/* Employer Partner Box */}
                      <Box sx={{ p: 1.2, bgcolor: '#eff6ff', borderRadius: 2, mb: 1.5, border: '1px solid #bfdbfe' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3 }}>
                          <BusinessIcon sx={{ fontSize: 16, color: '#1d4ed8' }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e40af' }}>
                            {emp?.name || 'Self-Employed / Independent'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, pl: 3 }}>
                          <LocationOnIcon sx={{ fontSize: 14, color: '#64748b' }} />
                          <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                            {plc.preferredLocation || emp?.location || 'Nepal'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Expected / Confirmed Salary */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.2, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0', mb: 1.5 }}>
                        <AttachMoneyIcon sx={{ fontSize: 20, color: '#166534' }} />
                        <Box>
                          <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700, display: 'block', fontSize: '0.68rem' }}>
                            REMUNERATION & COMPENSATION
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#15803d' }}>
                            {plc.expectedSalary || 'Negotiable'} ({plc.paymentType})
                          </Typography>
                        </Box>
                      </Box>

                      {plc.remarks && (
                        <Typography variant="caption" sx={{ color: '#647089', fontStyle: 'italic', display: 'block', mb: 1 }}>
                          "{plc.remarks}"
                        </Typography>
                      )}
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 1.5, borderTop: '1px solid #f1f5f9' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenEdit(plc)}
                        sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.78rem' }}
                      >
                        Edit
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(plc.id)}
                        sx={{ color: '#d5372f', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          {filteredPlacements.length === 0 && (
            <Card sx={{ p: 5, textAlign: 'center', borderRadius: 3, bgcolor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
              <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 700 }}>
                No placement records found matching "{searchTerm}"
              </Typography>
            </Card>
          )}
        </Box>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingItem ? 'Edit Career Placement Plan (EPP)' : 'Create Career Placement Plan (EPP)'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              select
              label="Select Student"
              fullWidth
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              required
            >
              {db.students.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name} ({s.tgid})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Target Job / Trade Title"
              fullWidth
              value={formData.targetJob}
              onChange={(e) => setFormData({ ...formData, targetJob: e.target.value })}
              placeholder="e.g. Senior Elderly Care Assistant"
              required
            />

            <TextField
              select
              label="Partner Employer (or Self-Employed)"
              fullWidth
              value={formData.employerId}
              onChange={(e) => setFormData({ ...formData, employerId: e.target.value })}
            >
              {db.employers.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.name} ({emp.industry})
                </MenuItem>
              ))}
            </TextField>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Expected Salary / Monthly Remuneration"
                  fullWidth
                  value={formData.expectedSalary}
                  onChange={(e) => setFormData({ ...formData, expectedSalary: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Employment Type"
                  fullWidth
                  value={formData.employmentType}
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                >
                  <MenuItem value="Full-Time Employee">Full-Time Employee</MenuItem>
                  <MenuItem value="Part-Time Employee">Part-Time Employee</MenuItem>
                  <MenuItem value="Self-Employed / Business">Self-Employed / Business</MenuItem>
                  <MenuItem value="Overseas Employment">Overseas Employment</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Work Schedule"
                  fullWidth
                  value={formData.workSchedule}
                  onChange={(e) => setFormData({ ...formData, workSchedule: e.target.value })}
                >
                  <MenuItem value="Day Shift">Day Shift</MenuItem>
                  <MenuItem value="Night Shift">Night Shift</MenuItem>
                  <MenuItem value="Rotational Shift">Rotational Shift</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Placement Status"
                  fullWidth
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="Planned">Planned</MenuItem>
                  <MenuItem value="Placed">Placed (Employed)</MenuItem>
                  <MenuItem value="Ongoing">Ongoing Trial</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <TextField
              label="Special Remarks / Contract Details"
              multiline
              rows={2}
              fullWidth
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingItem ? 'Update Placement Plan' : 'Save Placement Plan'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
