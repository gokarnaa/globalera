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
  Paper,
  Tabs,
  Tab,
  LinearProgress,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import { QRCodeSVG } from 'qrcode.react';
import { loadDB, saveDB } from '../../services/storage';
import { exportToExcel, getWhatsAppUrl } from '../../services/exportUtils';
import { useAuth } from '../../context/AuthContext';
import StudentProfileModal from './StudentProfileModal';
import StudentIdCardModal from '../admission/StudentIdCardModal';

export default function StudentManager() {
  const [db, setDb] = useState(loadDB());
  const { currentUser, isTrainer } = useAuth();

  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [profileStudent, setProfileStudent] = useState(null);
  const [idCardStudent, setIdCardStudent] = useState(null);
  const [profileTab, setProfileTab] = useState(0);

  const [filterGroup, setFilterGroup] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table');

  const [formData, setFormData] = useState({
    tgid: '',
    name: '',
    phone: '',
    secondaryPhone: '',
    email: '',
    gender: 'Female',
    dateOfBirth: '2002-01-01',
    citizenshipNumber: '',
    citizenshipDistrict: 'Kathmandu',
    permanentAddress: '',
    currentAddress: '',
    fatherName: '',
    motherName: '',
    guardianContact: '',
    groupId: '',
    admissionDate: new Date().toISOString().slice(0, 10),
    expectedEndDate: '',
    status: 'Active',
    photoUrl: ''
  });

  // Filter students based on trainer role & search
  const myGroups = isTrainer
    ? db.trainingGroups.filter((g) => g.trainerId === currentUser?.trainerId)
    : db.trainingGroups;

  let filteredStudents = db.students || [];
  if (isTrainer) {
    filteredStudents = filteredStudents.filter((s) => myGroups.some((g) => g.id === s.groupId));
  }
  if (filterGroup !== 'ALL') {
    filteredStudents = filteredStudents.filter((s) => s.groupId === filterGroup);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredStudents = filteredStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.tgid.toLowerCase().includes(q) ||
        s.phone.includes(q)
    );
  }

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      tgid: '',
      name: '',
      phone: '',
      secondaryPhone: '',
      email: '',
      gender: '',
      dateOfBirth: '',
      citizenshipNumber: '',
      citizenshipDistrict: '',
      permanentAddress: '',
      currentAddress: '',
      fatherName: '',
      motherName: '',
      guardianContact: '',
      groupId: '',
      admissionDate: '',
      expectedEndDate: '',
      status: 'Active',
      photoUrl: ''
    });
    setOpenAddDialog(true);
  };

  const handleOpenEdit = (std) => {
    setEditingItem(std);
    setFormData({ ...std });
    setOpenAddDialog(true);
  };

  const handleGroupSelect = (grpId) => {
    const grp = db.trainingGroups.find((g) => g.id === grpId);
    setFormData((prev) => ({
      ...prev,
      groupId: grpId,
      expectedEndDate: grp ? grp.expectedEndDate : prev.expectedEndDate
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.phone.trim() || !formData.groupId) {
      alert('Student Name, Phone, and Training Group are required.');
      return;
    }

    let updatedList = [...(db.students || [])];
    let updatedTimeline = [...(db.studentTimelines || [])];

    if (editingItem) {
      updatedList = updatedList.map((x) =>
        x.id === editingItem.id ? { ...x, ...formData } : x
      );
    } else {
      const newId = `STD-${String(updatedList.length + 1).padStart(2, '0')}`;
      const newStudent = { id: newId, ...formData };
      updatedList.push(newStudent);

      // Automated Timeline Event!
      updatedTimeline.push({
        id: `TL-${Date.now()}`,
        studentId: newId,
        eventType: 'Admission',
        title: 'New Student Enrolled',
        description: `Enrolled into Group code: ${db.trainingGroups.find((g) => g.id === formData.groupId)?.groupCode || 'Group'}`,
        createdAt: new Date().toISOString()
      });
    }

    const nextDb = { ...db, students: updatedList, studentTimelines: updatedTimeline };
    saveDB(nextDb);
    setDb(nextDb);
    setOpenAddDialog(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this student record?')) {
      const nextDb = {
        ...db,
        students: db.students.filter((x) => x.id !== id)
      };
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredStudents.map((s) => {
      const grp = db.trainingGroups.find((g) => g.id === s.groupId);
      const course = db.courses.find((c) => c.id === grp?.courseId);
      return {
        TGID: s.tgid,
        Name: s.name,
        Phone: s.phone,
        Gender: s.gender,
        DOB: s.dateOfBirth,
        Group: grp?.groupCode || '',
        Shift: grp?.shift || '',
        Course: course?.title || '',
        AdmissionDate: s.admissionDate,
        ExpectedEnd: s.expectedEndDate,
        Address: s.currentAddress,
        Status: s.status
      };
    });
    exportToExcel(exportData, 'KITE_Students_Roster');
  };

  // Helper for Student Profile stats
  const getStudentStats = (std) => {
    if (!std) return { present: 0, absent: 0, late: 0, rate: 0, masteredCount: 0, totalUnits: 0 };
    const atts = db.attendances.filter((a) => a.studentId === std.id);
    const present = atts.filter((a) => a.status === 'present').length;
    const absent = atts.filter((a) => a.status === 'absent').length;
    const late = atts.filter((a) => a.status === 'late').length;
    const total = atts.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 100;

    const grp = db.trainingGroups.find((g) => g.id === std.groupId);
    const trainer = db.trainers.find((t) => t.id === grp?.trainerId);
    const syllabi = db.syllabi.filter((s) => s.courseId === grp?.courseId);
    const evals = db.evaluations.filter((e) => e.studentId === std.id && e.mastered);
    const ojt = (db.ojts || []).find((o) => o.studentId === std.id);
    const ojtEmployer = ojt ? (db.employers || []).find((e) => e.id === ojt.employerId) : null;
    const placement = (db.placements || []).find((p) => p.studentId === std.id);
    const placementEmployer = placement ? (db.employers || []).find((e) => e.id === placement.employerId) : null;

    return {
      present,
      absent,
      late,
      rate,
      masteredCount: evals.length,
      totalUnits: syllabi.length,
      syllabi,
      evals,
      grp,
      trainer,
      ojt,
      ojtEmployer,
      placement,
      placementEmployer
    };
  };

  // Helper for Student Fee & Accounts Summary
  const getStudentFeeSummary = (std) => {
    const grp = (db.trainingGroups || []).find((g) => g.id === std.groupId);
    const crs = (db.courses || []).find((c) => c.id === grp?.courseId);
    const lockedFee = std.lockedCourseFee || crs?.price || 15000;
    const studentPayments = (db.payments || []).filter((p) => p.studentId === std.id);
    const totalPaid = studentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const due = Math.max(0, lockedFee - totalPaid);
    const status = due === 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid';
    return { lockedFee, totalPaid, due, status };
  };

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SchoolIcon sx={{ color: '#1a56b0', fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#152238' }}>
              Student Management & Digital Dossier (विद्यार्थी)
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#647089', mt: 0.5 }}>
            Students inherit Course & Occupation from their Training Group. Digital 360° Profiles & Verification QR Cards.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleExportExcel}>
            Export Excel
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
            + Enroll Student
          </Button>
        </Box>
      </Box>

      {/* Filter & Search Bar */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              size="small"
              placeholder="Search by Name, TGID, Phone..."
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#647089', fontSize: 20 }} />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3.5}>
            <TextField
              select
              size="small"
              label="Filter by Training Group"
              fullWidth
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
            >
              <MenuItem value="ALL">All Training Groups ({myGroups.length})</MenuItem>
              {myGroups.map((grp) => (
                <MenuItem key={grp.id} value={grp.id}>
                  {grp.groupCode} — Shift {grp.shift}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4.5} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="body2" sx={{ color: '#647089', fontWeight: 700, display: { xs: 'none', md: 'block' } }}>
              {filteredStudents.length} Students
            </Typography>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, next) => next && setViewMode(next)}
              size="small"
              sx={{ bgcolor: '#fff' }}
            >
              <ToggleButton value="table" sx={{ fontWeight: 700, px: 1.5 }}>
                <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} /> Table
              </ToggleButton>
              <ToggleButton value="card" sx={{ fontWeight: 700, px: 1.5 }}>
                <ViewModuleIcon fontSize="small" sx={{ mr: 0.5 }} /> Cards
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Card>

      {/* Students Data View (Table or Card) */}
      {viewMode === 'table' ? (
        <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, width: 60, textAlign: 'center' }}>S.N.</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Training Group & Shift</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Contact & WhatsApp</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Fee Status (शुल्क)</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Admission Date</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.map((std, idx) => {
                  const grp = db.trainingGroups.find((g) => g.id === std.groupId);
                  const course = db.courses.find((c) => c.id === grp?.courseId);

                  return (
                    <TableRow key={std.id} hover>
                      <TableCell sx={{ fontWeight: 800, color: '#647089', textAlign: 'center' }}>
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar src={std.photoUrl} sx={{ width: 44, height: 44, bgcolor: '#1a56b0', fontWeight: 800 }}>
                            {std.name[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                              {std.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#647089' }}>
                              {std.tgid} • {std.gender}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={grp?.groupCode || 'Unassigned'}
                          size="small"
                          sx={{ fontWeight: 800, bgcolor: '#1a56b0', color: '#fff', mb: 0.5, display: 'block', width: 'fit-content' }}
                        />
                        <Typography variant="caption" sx={{ color: '#647089', display: 'block' }}>
                          {course?.title || ''} (Shift {grp?.shift || ''})
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {std.phone}
                          </Typography>
                          <IconButton
                            size="small"
                            component="a"
                            href={getWhatsAppUrl(std.phone, `Namaste ${std.name}, update from KITE Training Center.`)}
                            target="_blank"
                            sx={{ color: '#25D366' }}
                          >
                            <WhatsAppIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const fee = getStudentFeeSummary(std);
                          const isPaid = fee.status === 'Paid';
                          const isPartial = fee.status === 'Partial';
                          return (
                            <Box>
                              <Chip
                                label={fee.status}
                                size="small"
                                sx={{
                                  fontWeight: 800,
                                  bgcolor: isPaid ? '#e5f8ee' : isPartial ? '#fef3c7' : '#fee2e2',
                                  color: isPaid ? '#16834b' : isPartial ? '#b45309' : '#dc2626',
                                  mb: 0.3
                                }}
                              />
                              <Typography variant="caption" sx={{ display: 'block', color: fee.due > 0 ? '#dc2626' : '#16834b', fontWeight: 700 }}>
                                {fee.due > 0 ? `Due: Rs. ${fee.due.toLocaleString()}` : `Paid in Full`}
                              </Typography>
                            </Box>
                          );
                        })()}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {std.admissionDate}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={std.status}
                          size="small"
                          sx={{
                            bgcolor: std.status === 'Active' ? '#e5f8ee' : '#fdeceb',
                            color: std.status === 'Active' ? '#16834b' : '#d5372f',
                            fontWeight: 700
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        <Tooltip title="View 360° Profile Dossier">
                          <IconButton size="small" onClick={() => setProfileStudent(std)} sx={{ color: '#1a56b0' }}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Generate Digital QR ID Card">
                          <IconButton size="small" onClick={() => setIdCardStudent(std)} sx={{ color: '#6c3fc9' }}>
                            <QrCode2Icon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <IconButton size="small" onClick={() => handleOpenEdit(std)} sx={{ color: '#1a56b0' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(std.id)} sx={{ color: '#d5372f' }}>
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
      ) : (
        /* Card View */
        <Grid container spacing={2}>
          {filteredStudents.map((std, idx) => {
            const grp = db.trainingGroups.find((g) => g.id === std.groupId);
            const course = db.courses.find((c) => c.id === grp?.courseId);

            return (
              <Grid item xs={12} sm={6} md={4} key={std.id}>
                <Card
                  sx={{
                    p: 2.2,
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 3px 12px rgba(0,0,0,0.04)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      borderColor: '#cbd5e1'
                    }
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Chip label={`S.N. ${idx + 1}`} size="small" sx={{ bgcolor: '#f1f5f9', fontWeight: 900, color: '#475569' }} />
                      <Chip
                        label={std.status}
                        size="small"
                        sx={{
                          bgcolor: std.status === 'Active' ? '#e5f8ee' : '#fdeceb',
                          color: std.status === 'Active' ? '#16834b' : '#d5372f',
                          fontWeight: 700
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Avatar src={std.photoUrl} sx={{ width: 48, height: 48, bgcolor: '#1a56b0', fontWeight: 800 }}>
                        {std.name[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                          {std.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#647089' }}>
                          {std.tgid} • {std.gender}
                        </Typography>
                      </Box>
                    </Box>

                    <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, bgcolor: '#f8fafc', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#1a56b0', fontWeight: 800, display: 'block' }}>
                          Group {grp?.groupCode || 'Unassigned'} • Shift {grp?.shift || ''}
                        </Typography>
                        {(() => {
                          const fee = getStudentFeeSummary(std);
                          const isPaid = fee.status === 'Paid';
                          const isPartial = fee.status === 'Partial';
                          return (
                            <Chip
                              label={fee.status}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                bgcolor: isPaid ? '#e5f8ee' : isPartial ? '#fef3c7' : '#fee2e2',
                                color: isPaid ? '#16834b' : isPartial ? '#b45309' : '#dc2626'
                              }}
                            />
                          );
                        })()}
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        {course?.title || 'Vocational Training'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#647089', display: 'block', mt: 0.3 }}>
                        Phone: {std.phone} • Admitted: {std.admissionDate}
                      </Typography>
                    </Paper>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid #f1f5f9' }}>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => setProfileStudent(std)}
                      sx={{ fontWeight: 800, textTransform: 'none' }}
                    >
                      360° Profile
                    </Button>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Digital QR ID Card">
                        <IconButton size="small" onClick={() => setIdCardStudent(std)} sx={{ color: '#6c3fc9' }}>
                          <QrCode2Icon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton size="small" onClick={() => handleOpenEdit(std)} sx={{ color: '#1a56b0' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(std.id)} sx={{ color: '#d5372f' }}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            );
          })}
          {filteredStudents.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 6, textAlign: 'center', color: '#94a3b8', borderRadius: 3 }}>
                No students found matching your criteria.
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Enroll / Edit Student Dialog */}
      <Dialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        maxWidth="md"
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
              <PersonAddAlt1Icon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.2 }}>
                {editingItem ? 'विद्यार्थी विवरण सम्पादन (Edit Student Details)' : 'नयाँ विद्यार्थी भर्ना (Enroll New Student)'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.72rem' }}>
                {editingItem ? 'विद्यार्थीको व्यक्तिगत तथा शैक्षिक विवरण अद्यावधिक गर्नुहोस्' : 'प्रशिक्षार्थीको व्यक्तिगत विवरण र तालिम समूह आबद्धता भर्नुहोस्'}
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={() => setOpenAddDialog(false)}
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
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Student TGID *"
                  fullWidth
                  size="small"
                  placeholder="उदा: TGID-105"
                  value={formData.tgid}
                  onChange={(e) => setFormData({ ...formData, tgid: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Full Name (देवनागरी / English) *"
                  fullWidth
                  size="small"
                  placeholder="उदा: सीता शर्मा / Sita Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
            </Grid>

            {/* Operational Training Group Selection */}
            <TextField
              select
              label="Assign to Training Group (Class & Shift) *"
              fullWidth
              size="small"
              value={formData.groupId}
              onChange={(e) => handleGroupSelect(e.target.value)}
              helperText="समूह चयन गर्दा विद्यार्थी स्वतः सम्बन्धित पाठ्यक्रम, प्रशिक्षक र सिफ्टसँग आबद्ध हुन्छ।"
              required
            >
              <MenuItem value="" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                -- तालिम समूह चयन गर्नुहोस् (Select Group) --
              </MenuItem>
              {myGroups.map((grp) => {
                const crs = db.courses.find((c) => c.id === grp.courseId);
                return (
                  <MenuItem key={grp.id} value={grp.id}>
                    {grp.groupCode} — {crs?.title} (Shift {grp.shift}: {grp.startTime} – {grp.endTime})
                  </MenuItem>
                );
              })}
            </TextField>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Primary Mobile (WhatsApp Enabled) *"
                  fullWidth
                  size="small"
                  placeholder="98XXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Secondary Phone / Guardian Contact"
                  fullWidth
                  size="small"
                  placeholder="98XXXXXXXX"
                  value={formData.secondaryPhone}
                  onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  label="Gender"
                  fullWidth
                  size="small"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <MenuItem value="" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                    -- लिंग चयन गर्नुहोस् --
                  </MenuItem>
                  <MenuItem value="Female">Female (महिला)</MenuItem>
                  <MenuItem value="Male">Male (पुरुष)</MenuItem>
                  <MenuItem value="Other">Other (अन्य)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  type="date"
                  label="Date of Birth"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Citizenship Number"
                  fullWidth
                  size="small"
                  placeholder="उदा: 27-01-75-XXXXX"
                  value={formData.citizenshipNumber}
                  onChange={(e) => setFormData({ ...formData, citizenshipNumber: e.target.value })}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Permanent Address"
                  fullWidth
                  size="small"
                  placeholder="उदा: Pokhara-8, Kaski"
                  value={formData.permanentAddress}
                  onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Current Address"
                  fullWidth
                  size="small"
                  placeholder="उदा: Koteshwor, Kathmandu"
                  value={formData.currentAddress}
                  onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Father Name"
                  fullWidth
                  size="small"
                  placeholder="बुबाको नाम"
                  value={formData.fatherName}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mother Name"
                  fullWidth
                  size="small"
                  placeholder="आमाको नाम"
                  value={formData.motherName}
                  onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  type="date"
                  label="Admission Date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={formData.admissionDate}
                  onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Status"
                  fullWidth
                  size="small"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="Active">Active (सक्रिय)</MenuItem>
                  <MenuItem value="Completed">Completed (सम्पन्न)</MenuItem>
                  <MenuItem value="OJT">OJT Phase (इन्टर्नसिप)</MenuItem>
                  <MenuItem value="Placed">Placed (रोजगारीमा)</MenuItem>
                  <MenuItem value="Dropout">Dropout (छोडेको)</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <TextField
              label="Photo URL (Optional)"
              fullWidth
              size="small"
              placeholder="https://example.com/photo.jpg"
              value={formData.photoUrl}
              onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
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
            onClick={() => setOpenAddDialog(false)}
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
            सुरक्षित गर्नुहोस् (Save Student)
          </Button>
        </DialogActions>
      </Dialog>

      {/* 360° Student Profile Modal (Customized per User Design) */}
      <StudentProfileModal
        open={Boolean(profileStudent)}
        student={profileStudent}
        db={db}
        setDb={setDb}
        onClose={() => setProfileStudent(null)}
        onEditStudent={(s) => {
          handleOpenEdit(s);
        }}
        onOpenIdCard={(s) => {
          setIdCardStudent(s);
        }}
      />

      {/* Official Epson L8050 Printable Student ID Card Modal */}
      {idCardStudent && (
        <StudentIdCardModal
          open={Boolean(idCardStudent)}
          onClose={() => setIdCardStudent(null)}
          student={idCardStudent}
          admission={(db.admissions || []).find((a) => a.studentId === idCardStudent.id || a.tgid === idCardStudent.tgid)}
        />
      )}
    </Box>
  );
}
