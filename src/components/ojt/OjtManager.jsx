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
import WorkIcon from '@mui/icons-material/Work';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BusinessIcon from '@mui/icons-material/Business';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import { loadDB, saveDB } from '../../services/storage';
import { getWhatsAppUrl } from '../../services/exportUtils';

export default function OjtManager() {
  const [db, setDb] = useState(loadDB());
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table');

  const [formData, setFormData] = useState({
    studentId: db.students[0]?.id || '',
    employerId: db.employers[0]?.id || '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    relatedPerson: '',
    contactNumber: '',
    status: 'Ongoing',
    remarks: ''
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    const today = new Date();
    const end = new Date(today);
    end.setMonth(end.getMonth() + 1);

    setFormData({
      studentId: db.students[0]?.id || '',
      employerId: db.employers[0]?.id || '',
      startDate: today.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      relatedPerson: db.employers[0]?.contactPerson || 'Supervisor',
      contactNumber: db.employers[0]?.phone || '',
      status: 'Ongoing',
      remarks: 'Hands-on practical apprenticeship.'
    });
    setOpenDialog(true);
  };

  const handleEmployerSelect = (empId) => {
    const emp = db.employers.find((e) => e.id === empId);
    setFormData((prev) => ({
      ...prev,
      employerId: empId,
      relatedPerson: emp?.contactPerson || prev.relatedPerson,
      contactNumber: emp?.phone || prev.contactNumber
    }));
  };

  const handleSave = () => {
    if (!formData.studentId || !formData.employerId) {
      alert('Student and Employer are required.');
      return;
    }

    let updatedList = [...db.ojts];
    if (editingItem) {
      updatedList = updatedList.map((x) =>
        x.id === editingItem.id ? { ...x, ...formData } : x
      );
    } else {
      const newId = `OJT-${String(updatedList.length + 1).padStart(2, '0')}`;
      updatedList.push({ id: newId, ...formData });

      // Add to Student Timeline
      const std = db.students.find((s) => s.id === formData.studentId);
      const emp = db.employers.find((e) => e.id === formData.employerId);
      db.studentTimelines.unshift({
        id: `TL-${Date.now()}`,
        studentId: formData.studentId,
        eventType: 'OJT',
        title: `OJT Started at ${emp?.name || 'Company'}`,
        description: `Hands-on apprenticeship from ${formData.startDate} to ${formData.endDate}. Supervisor: ${formData.relatedPerson}`,
        createdAt: new Date().toISOString()
      });
    }

    const nextDb = { ...db, ojts: updatedList };
    saveDB(nextDb);
    setDb(nextDb);
    setOpenDialog(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this OJT record?')) {
      const nextDb = {
        ...db,
        ojts: db.ojts.filter((x) => x.id !== id)
      };
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      studentId: item.studentId,
      employerId: item.employerId,
      startDate: item.startDate || '',
      endDate: item.endDate || '',
      relatedPerson: item.relatedPerson || '',
      contactNumber: item.contactNumber || '',
      status: item.status || 'Ongoing',
      remarks: item.remarks || ''
    });
    setOpenDialog(true);
  };

  const totalOjts = (db.ojts || []).length;
  const ongoingOjts = (db.ojts || []).filter((o) => o.status === 'Ongoing').length;
  const completedOjts = (db.ojts || []).filter((o) => o.status === 'Completed').length;
  const plannedOjts = (db.ojts || []).filter((o) => o.status === 'Planned').length;

  const filteredOjts = (db.ojts || []).filter((ojt) => {
    const std = db.students.find((s) => s.id === ojt.studentId);
    const emp = db.employers.find((e) => e.id === ojt.employerId);
    const q = searchTerm.toLowerCase();

    const matchesSearch =
      !searchTerm ||
      (std?.name || '').toLowerCase().includes(q) ||
      (std?.tgid || '').toLowerCase().includes(q) ||
      (emp?.name || '').toLowerCase().includes(q) ||
      (emp?.location || '').toLowerCase().includes(q) ||
      (ojt.relatedPerson || '').toLowerCase().includes(q) ||
      (ojt.contactNumber || '').toLowerCase().includes(q) ||
      (ojt.startDate || '').toLowerCase().includes(q) ||
      (ojt.endDate || '').toLowerCase().includes(q) ||
      (ojt.id || '').toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'All' || ojt.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <WorkIcon sx={{ color: '#1a56b0', fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#152238' }}>
              On-the-Job Training (OJT Records)
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#647089', mt: 0.5 }}>
            Binds Student to Employer Partner. Auto-locks company details and syncs with student timeline.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd} sx={{ fontWeight: 800 }}>
          + Deploy Student to OJT
        </Button>
      </Box>

      {/* KPI Summary Cards */}
      <Card sx={{ p: 2, mb: 3, bgcolor: '#ffffff', borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f8fafc', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: 'block' }}>
                TOTAL OJT DEPLOYED
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a' }}>
                {totalOjts}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#eff6ff', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 700, display: 'block' }}>
                ONGOING
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#1d4ed8' }}>
                {ongoingOjts}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f0fdf4', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700, display: 'block' }}>
                COMPLETED
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#15803d' }}>
                {completedOjts}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#fefce8', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#854d0e', fontWeight: 700, display: 'block' }}>
                PLANNED
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#a16207' }}>
                {plannedOjts}
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
            placeholder="Search student, employer, supervisor, phone..."
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
            {['All', 'Ongoing', 'Completed', 'Planned'].map((st) => (
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
            Showing {filteredOjts.length} of {totalOjts}
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
                  <TableCell sx={{ fontWeight: 800 }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Host Employer Partner</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>OJT Dates</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>On-Site Supervisor</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOjts.map((ojt, idx) => {
                  const std = db.students.find((s) => s.id === ojt.studentId);
                  const emp = db.employers.find((e) => e.id === ojt.employerId);

                  return (
                    <TableRow key={ojt.id} hover>
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
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                          {emp?.name || 'Employer'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#647089' }}>
                          {emp?.location || ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {ojt.startDate}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#16834b', fontWeight: 700 }}>
                          → {ojt.endDate}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {ojt.relatedPerson || '—'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: '#647089' }}>{ojt.contactNumber}</Typography>
                          {ojt.contactNumber && (
                            <IconButton
                              size="small"
                              component="a"
                              href={getWhatsAppUrl(ojt.contactNumber, `Namaste, greetings regarding student ${std?.name} OJT.`)}
                              target="_blank"
                              sx={{ color: '#25D366' }}
                            >
                              <WhatsAppIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ojt.status}
                          size="small"
                          sx={{
                            bgcolor: ojt.status === 'Completed' ? '#e5f8ee' : ojt.status === 'Ongoing' ? '#e8f0fd' : '#fdf3e2',
                            color: ojt.status === 'Completed' ? '#16834b' : ojt.status === 'Ongoing' ? '#1a56b0' : '#c9820a',
                            fontWeight: 700
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        <IconButton size="small" onClick={() => handleOpenEdit(ojt)} sx={{ color: '#1a56b0', mr: 0.5 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(ojt.id)} sx={{ color: '#d5372f' }}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredOjts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 5, color: '#94a3b8' }}>
                      No OJT records found matching the filter criteria.
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
            {filteredOjts.map((ojt, idx) => {
              const std = db.students.find((s) => s.id === ojt.studentId);
              const emp = db.employers.find((e) => e.id === ojt.employerId);

              return (
                <Grid item xs={12} sm={6} md={4} key={ojt.id}>
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
                            label={ojt.id}
                            size="small"
                            sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: '0.72rem' }}
                          />
                        </Box>
                        <Chip
                          label={ojt.status}
                          size="small"
                          sx={{
                            bgcolor: ojt.status === 'Completed' ? '#e5f8ee' : ojt.status === 'Ongoing' ? '#e8f0fd' : '#fdf3e2',
                            color: ojt.status === 'Completed' ? '#16834b' : ojt.status === 'Ongoing' ? '#1a56b0' : '#c9820a',
                            fontWeight: 800
                          }}
                        />
                      </Box>

                      {/* Student Profile Row */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, p: 1.2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                        <Avatar src={std?.photoUrl} sx={{ width: 44, height: 44, bgcolor: '#1a56b0', fontWeight: 800 }}>
                          {std?.name?.[0] || 'S'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                            {std?.name || 'Trainee'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: 'block' }}>
                            TGID: {std?.tgid} • Phone: {std?.phone || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Host Employer Box */}
                      <Box sx={{ mb: 1.5, p: 1.5, bgcolor: '#eff6ff', borderRadius: 2, border: '1px solid #bfdbfe' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <BusinessIcon sx={{ fontSize: 18, color: '#1d4ed8' }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e40af' }}>
                            {emp?.name || 'Host Employer'}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: '#475569', display: 'block', pl: 3.2 }}>
                          {emp?.location || 'Location Not Specified'} • {emp?.industry || 'Healthcare'}
                        </Typography>
                      </Box>

                      {/* Supervisor & Contact */}
                      <Box sx={{ p: 1.2, bgcolor: '#f8fafc', borderRadius: 2, mb: 1.5, border: '1px solid #f1f5f9' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <PersonIcon sx={{ fontSize: 16, color: '#64748b' }} />
                            <Box>
                              <Typography variant="caption" sx={{ color: '#647089', display: 'block', fontSize: '0.68rem' }}>
                                ON-SITE SUPERVISOR
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                {ojt.relatedPerson || 'Supervisor: N/A'}
                              </Typography>
                            </Box>
                          </Box>
                          {ojt.contactNumber && (
                            <IconButton
                              size="small"
                              component="a"
                              href={getWhatsAppUrl(ojt.contactNumber, `Namaste, greetings regarding student ${std?.name} OJT.`)}
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
                      </Box>

                      {/* Dates & Duration */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.2, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0', mb: 1.5 }}>
                        <CalendarTodayIcon sx={{ fontSize: 16, color: '#166534' }} />
                        <Box>
                          <Typography variant="caption" sx={{ color: '#166534', fontWeight: 800, display: 'block', fontSize: '0.72rem' }}>
                            {ojt.startDate} → {ojt.endDate}
                          </Typography>
                        </Box>
                      </Box>

                      {ojt.remarks && (
                        <Typography variant="caption" sx={{ color: '#647089', fontStyle: 'italic', display: 'block', mb: 1 }}>
                          "{ojt.remarks}"
                        </Typography>
                      )}
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 1.5, borderTop: '1px solid #f1f5f9' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenEdit(ojt)}
                        sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.78rem' }}
                      >
                        Edit
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(ojt.id)}
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
          {filteredOjts.length === 0 && (
            <Card sx={{ p: 5, textAlign: 'center', borderRadius: 3, bgcolor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
              <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 700 }}>
                No OJT deployment records found matching "{searchTerm}"
              </Typography>
            </Card>
          )}
        </Box>
      )}

      {/* Add / Edit OJT Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingItem ? 'Edit OJT Deployment Record' : 'Deploy Student to OJT'}
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
              select
              label="Select Host Employer Partner"
              fullWidth
              value={formData.employerId}
              onChange={(e) => handleEmployerSelect(e.target.value)}
              required
            >
              {db.employers.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.name} ({emp.location})
                </MenuItem>
              ))}
            </TextField>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="OJT Start Date"
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
                  label="OJT Completion Date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Site Supervisor Name"
                  fullWidth
                  value={formData.relatedPerson}
                  onChange={(e) => setFormData({ ...formData, relatedPerson: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Supervisor Contact Number"
                  fullWidth
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                />
              </Grid>
            </Grid>

            <TextField
              select
              label="Status"
              fullWidth
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <MenuItem value="Planned">Planned</MenuItem>
              <MenuItem value="Ongoing">Ongoing</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Terminated">Terminated</MenuItem>
            </TextField>

            <TextField
              label="Department / Assignment Notes"
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
            {editingItem ? 'Update OJT Deployment' : 'Save OJT Deployment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
