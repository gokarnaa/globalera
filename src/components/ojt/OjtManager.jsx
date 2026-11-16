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
  ToggleButtonGroup,
  Alert
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
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { loadDB, saveDB } from '../../services/storage';
import { getWhatsAppUrl } from '../../services/exportUtils';

// Helper: Check student fee clearance status (2nd installment due rule)
export const getStudentFeeDue = (studentId, db) => {
  if (!studentId || !db) return { lockedFee: 0, totalPaid: 0, due: 0, isCleared: true };
  const std = (db.students || []).find((s) => s.id === studentId);
  if (!std) return { lockedFee: 0, totalPaid: 0, due: 0, isCleared: true };
  const grp = (db.trainingGroups || []).find((g) => g.id === std.groupId);
  const crs = (db.courses || []).find((c) => c.id === grp?.courseId);
  const lockedFee = Number(std.lockedCourseFee) || Number(crs?.price) || 15000;
  const studentPayments = (db.payments || []).filter((p) => p.studentId === studentId);
  const totalPaid = studentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const due = Math.max(0, lockedFee - totalPaid);
  return { lockedFee, totalPaid, due, isCleared: due <= 0 };
};

export default function OjtManager() {
  const [db, setDb] = useState(loadDB());
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table');

  const [formData, setFormData] = useState({
    studentId: db.students?.[0]?.id || '',
    employerId: db.employers?.[0]?.id || '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    relatedPerson: '',
    contactNumber: '',
    status: 'Ongoing',
    remarks: ''
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      studentId: '',
      employerId: '',
      startDate: '',
      endDate: '',
      relatedPerson: '',
      contactNumber: '',
      status: 'Ongoing',
      remarks: ''
    });
    setOpenDialog(true);
  };

  const handleEmployerSelect = (empId) => {
    const emp = (db.employers || []).find((e) => e.id === empId);
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

    // Strict Institutional Rule: Block OJT deployment if 2nd installment fee is unpaid
    const feeStatus = getStudentFeeDue(formData.studentId, db);
    if (!feeStatus.isCleared) {
      alert(`⛔ OJT Placement Blocked!\n\nTrainee has an unpaid 2nd installment balance of NPR ${feeStatus.due.toLocaleString()}.\n\nInstitutional policy strictly prohibits hospital OJT placement until all training fees are 100% settled.`);
      return;
    }

    let updatedList = [...(db.ojts || [])];
    let updatedTimelines = [...(db.studentTimelines || [])];

    if (editingItem) {
      updatedList = updatedList.map((x) =>
        x.id === editingItem.id ? { ...x, ...formData } : x
      );
    } else {
      const newId = `OJT-${String(updatedList.length + 1).padStart(2, '0')}`;
      updatedList.push({ id: newId, ...formData });

      // Add to Student Timeline
      const std = (db.students || []).find((s) => s.id === formData.studentId);
      const emp = (db.employers || []).find((e) => e.id === formData.employerId);
      updatedTimelines.unshift({
        id: `TL-${Date.now()}`,
        studentId: formData.studentId,
        eventType: 'OJT',
        title: `OJT Started at ${emp?.name || 'Company'}`,
        description: `Hands-on apprenticeship from ${formData.startDate} to ${formData.endDate}. Supervisor: ${formData.relatedPerson}`,
        createdAt: new Date().toISOString()
      });
    }

    const nextDb = { ...db, ojts: updatedList, studentTimelines: updatedTimelines };
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
    const std = (db.students || []).find((s) => s.id === ojt.studentId);
    const emp = (db.employers || []).find((e) => e.id === ojt.employerId);
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
          <Grid item xs={12} md={8}>
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
                <WorkIcon sx={{ fontSize: 20, color: '#fbbf24' }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  noWrap
                  sx={{ fontWeight: 800, color: '#ffffff', fontSize: { xs: '0.96rem', sm: '1.06rem' }, lineHeight: 1.2 }}
                >
                  On-the-Job Training (OJT Records)
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ color: '#cbd5e1', display: 'block', fontSize: '0.73rem', mt: 0.15 }}
                >
                  Prabidhik School, Jorpati • Binds student to employer partner and syncs with trainee timeline
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
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
                + Deploy Student to OJT
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* 4 Compact Single-Row KPI Cards */}
      <Grid container spacing={1.5} sx={{ mb: 1.75 }}>
        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 1.4,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              borderLeft: '3.5px solid #1e40af',
              bgcolor: '#ffffff'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" noWrap sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.66rem', letterSpacing: '0.03em', display: 'block' }}>
                  Total OJT Deployed
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#0f2e5a', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {totalOjts}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  Total Assignments
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#eff6ff', borderRadius: 1.5, color: '#1e40af', flexShrink: 0 }}>
                <WorkIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 1.4,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              borderLeft: '3.5px solid #0284c7',
              bgcolor: '#ffffff'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" noWrap sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.66rem', letterSpacing: '0.03em', display: 'block' }}>
                  Ongoing OJT
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#0284c7', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {ongoingOjts}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#0284c7', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  Active in Field
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f0f9ff', borderRadius: 1.5, color: '#0284c7', flexShrink: 0 }}>
                <BusinessIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 1.4,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              borderLeft: '3.5px solid #059669',
              bgcolor: '#ffffff'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" noWrap sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.66rem', letterSpacing: '0.03em', display: 'block' }}>
                  Completed
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#059669', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {completedOjts}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#059669', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  Finished OJT Hours
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#ecfdf5', borderRadius: 1.5, color: '#059669', flexShrink: 0 }}>
                <CheckCircleIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 1.4,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              borderLeft: '3.5px solid #d97706',
              bgcolor: '#ffffff'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" noWrap sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.66rem', letterSpacing: '0.03em', display: 'block' }}>
                  Planned
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#d97706', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {plannedOjts}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#d97706', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  Scheduled Deployment
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fffbeb', borderRadius: 1.5, color: '#d97706', flexShrink: 0 }}>
                <CalendarTodayIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

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
              placeholder="Search student, employer, supervisor, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: { xs: '100%', sm: 320 }, bgcolor: '#ffffff' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                  </InputAdornment>
                )
              }}
            />

            <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap' }}>
              {['All', 'Ongoing', 'Completed', 'Planned'].map((st) => (
                <Chip
                  key={st}
                  label={st}
                  size="small"
                  clickable
                  color={statusFilter === st ? 'primary' : 'default'}
                  onClick={() => setStatusFilter(st)}
                  sx={{ fontWeight: 700, fontSize: '0.74rem' }}
                />
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, fontSize: '0.74rem' }}>
              Showing {filteredOjts.length} of {totalOjts}
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
                  const std = (db.students || []).find((s) => s.id === ojt.studentId);
                  const emp = (db.employers || []).find((e) => e.id === ojt.employerId);

                  return (
                    <TableRow key={ojt.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem' }}>
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Avatar src={std?.photoUrl} sx={{ width: 30, height: 30, bgcolor: '#1a56b0', fontWeight: 700, fontSize: '0.78rem' }}>
                            {std?.name?.[0] || 'S'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.8rem' }}>
                              {std?.name || 'Student'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#647089', display: 'flex', alignItems: 'center', gap: 0.6, fontSize: '0.7rem' }}>
                              <span>{std?.tgid}</span>
                              {(() => {
                                const f = getStudentFeeDue(std?.id, db);
                                return f.due > 0 ? (
                                  <Chip label={`Due: NPR ${f.due.toLocaleString()}`} size="small" sx={{ height: 17, fontSize: '0.62rem', fontWeight: 800, bgcolor: '#FEE2E2', color: '#DC2626' }} />
                                ) : (
                                  <Chip label="Fee Cleared" size="small" sx={{ height: 17, fontSize: '0.62rem', fontWeight: 800, bgcolor: '#ECFDF5', color: '#059669' }} />
                                );
                              })()}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.8rem' }}>
                          {emp?.name || 'Employer'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#647089', fontSize: '0.7rem' }}>
                          {emp?.location || ''}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>
                          {ojt.startDate}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#16834b', fontWeight: 700, fontSize: '0.7rem' }}>
                          → {ojt.endDate}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>
                          {ojt.relatedPerson || '—'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                          <Typography variant="caption" sx={{ color: '#647089', fontSize: '0.7rem' }}>{ojt.contactNumber}</Typography>
                          {ojt.contactNumber && (
                            <IconButton
                              size="small"
                              component="a"
                              href={getWhatsAppUrl(ojt.contactNumber, `Namaste, greetings from Prabidhik School, Jorpati regarding student ${std?.name} OJT.`)}
                              target="_blank"
                              sx={{ color: '#25D366', p: 0.25 }}
                            >
                              <WhatsAppIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ojt.status}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.68rem',
                            bgcolor: ojt.status === 'Completed' ? '#e5f8ee' : ojt.status === 'Ongoing' ? '#e8f0fd' : '#fdf3e2',
                            color: ojt.status === 'Completed' ? '#16834b' : ojt.status === 'Ongoing' ? '#1a56b0' : '#c9820a',
                            fontWeight: 700
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <IconButton size="small" onClick={() => handleOpenEdit(ojt)} sx={{ color: '#1a56b0', p: 0.4, mr: 0.25 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(ojt.id)} sx={{ color: '#d5372f', p: 0.4 }}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredOjts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3.5, color: '#94a3b8', fontSize: '0.8rem' }}>
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
              const std = (db.students || []).find((s) => s.id === ojt.studentId);
              const emp = (db.employers || []).find((e) => e.id === ojt.employerId);

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
              <WorkIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.2 }}>
                {editingItem ? 'Edit OJT Deployment' : 'Deploy Student to OJT'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.72rem' }}>
                Assign trainees to host employer partners for practical workplace training
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
            {(() => {
              const selectedFee = getStudentFeeDue(formData.studentId, db);
              const isLocked = Boolean(formData.studentId && !selectedFee.isCleared);

              return (
                <>
                  <TextField
                    select
                    label="Select Student *"
                    fullWidth
                    size="small"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    required
                  >
                    <MenuItem value="" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                      -- Select Student --
                    </MenuItem>
                    {(db.students || []).map((s) => {
                      const f = getStudentFeeDue(s.id, db);
                      return (
                        <MenuItem key={s.id} value={s.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                          <span>{s.name} ({s.tgid})</span>
                          {f.due > 0 ? (
                            <Chip
                              label={`Due: NPR ${f.due.toLocaleString()} (Lock)`}
                              size="small"
                              sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, bgcolor: '#FEE2E2', color: '#DC2626' }}
                            />
                          ) : (
                            <Chip
                              label="✓ Cleared"
                              size="small"
                              sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, bgcolor: '#ECFDF5', color: '#059669' }}
                            />
                          )}
                        </MenuItem>
                      );
                    })}
                  </TextField>

                  {isLocked && (
                    <Alert
                      severity="error"
                      icon={<WarningAmberIcon />}
                      sx={{ fontWeight: 700, fontSize: '0.8rem', borderRadius: 2 }}
                    >
                      ⛔ OJT Deployment Blocked: Trainee has an unpaid 2nd installment balance of <b>NPR {selectedFee.due.toLocaleString()}</b>. Institutional rules mandate 100% fee clearance before clinical or hospital placement.
                    </Alert>
                  )}
                </>
              );
            })()}

            <TextField
              select
              label="Select Host Employer Partner *"
              fullWidth
              size="small"
              value={formData.employerId}
              onChange={(e) => handleEmployerSelect(e.target.value)}
              required
            >
              <MenuItem value="" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                -- Select Employer --
              </MenuItem>
              {(db.employers || []).map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.name} ({emp.location})
                </MenuItem>
              ))}
            </TextField>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="OJT Start Date *"
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
                  label="OJT Completion Date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Site Supervisor Name"
                  fullWidth
                  size="small"
                  placeholder="Supervisor Name"
                  value={formData.relatedPerson}
                  onChange={(e) => setFormData({ ...formData, relatedPerson: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Supervisor Contact Number"
                  fullWidth
                  size="small"
                  placeholder="98XXXXXXXX"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                />
              </Grid>
            </Grid>

            <TextField
              select
              label="Status"
              fullWidth
              size="small"
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
              size="small"
              placeholder="Department, job description, or special remarks..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
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
          {(() => {
            const feeCheck = getStudentFeeDue(formData.studentId, db);
            const isLocked = Boolean(formData.studentId && !feeCheck.isCleared);

            return (
              <Button
                variant="contained"
                disabled={isLocked}
                startIcon={<CheckCircleIcon />}
                onClick={handleSave}
                sx={{
                  fontWeight: 800,
                  bgcolor: isLocked ? '#94A3B8 !important' : '#059669',
                  color: '#FFFFFF',
                  borderRadius: 2,
                  px: 3,
                  boxShadow: isLocked ? 'none' : '0 4px 12px rgba(5, 150, 105, 0.25)',
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: isLocked ? '#94A3B8' : '#047857'
                  }
                }}
              >
                {isLocked ? 'Blocked (Fee Due)' : (editingItem ? 'Update OJT' : 'Save OJT')}
              </Button>
            );
          })()}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
