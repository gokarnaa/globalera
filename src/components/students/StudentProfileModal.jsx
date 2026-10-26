import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Grid,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Menu,
  MenuItem,
  Tooltip,
  Stack,
  Divider,
  Paper
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import PrintIcon from '@mui/icons-material/Print';
import ReceiptModal from '../accounts/ReceiptModal';
import { saveDB, logAudit } from '../../services/storage';
import { getWhatsAppUrl } from '../../services/exportUtils';

export default function StudentProfileModal({
  open,
  student,
  db,
  setDb,
  onClose,
  onEditStudent,
  onOpenIdCard
}) {
  const [activeTab, setActiveTab] = useState('Profile'); // 'Profile' | 'Attendance' | 'Evaluation' | 'OJT' | 'EPP' | 'Notes'
  const [newNoteText, setNewNoteText] = useState('');
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  // OJT Dialog State
  const [openOjtDialog, setOpenOjtDialog] = useState(false);
  const [ojtForm, setOjtForm] = useState({
    employerId: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    relatedPerson: '',
    contactNumber: '',
    status: 'Ongoing',
    remarks: ''
  });

  // Placement (EPP) Dialog State
  const [openPlacementDialog, setOpenPlacementDialog] = useState(false);
  const [placementForm, setPlacementForm] = useState({
    employerId: '',
    targetJob: '',
    preferredLocation: '',
    expectedSalary: 'NPR 25,000 / month',
    employmentType: 'Full-Time Employee',
    workSchedule: '09:00 AM – 05:00 PM',
    paymentType: 'Monthly Salary',
    placementDate: new Date().toISOString().slice(0, 10),
    status: 'Placed',
    remarks: ''
  });

  // Employer Quick Details Dialog
  const [viewEmployerDetails, setViewEmployerDetails] = useState(null);

  // Fee & Receipt Dialog State
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState(null);

  if (!student) return null;

  // Find associated group, course, trainer, syllabi
  const grp = (db.trainingGroups || []).find((g) => g.id === student.groupId);
  const course = (db.courses || []).find((c) => c.id === grp?.courseId);
  const trainer = (db.trainers || []).find((t) => t.id === grp?.trainerId);
  const syllabi = (db.syllabi || []).filter((s) => s.courseId === course?.id);

  // Attendances
  const attendances = (db.attendances || []).filter((a) => a.studentId === student.id);
  const presentCount = attendances.filter((a) => a.status === 'present' || a.status === 'P').length;
  const absentCount = attendances.filter((a) => a.status === 'absent' || a.status === 'A').length;
  const lateCount = attendances.filter((a) => a.status === 'late' || a.status === 'L').length;
  const totalSessions = attendances.length;
  const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;

  // Evaluations
  const evaluations = (db.evaluations || []).filter((e) => e.studentId === student.id);
  const masteredUnits = evaluations.filter((e) => e.mastered);

  // OJT & Placement
  const ojt = (db.ojts || []).find((o) => o.studentId === student.id);
  const ojtEmployer = ojt ? (db.employers || []).find((e) => e.id === ojt.employerId) : null;
  const placement = (db.placements || []).find((p) => p.studentId === student.id);
  const placementEmployer = placement ? (db.employers || []).find((e) => e.id === placement.employerId) : null;

  // Notes
  const studentNotes = (db.studentNotes || []).filter((n) => n.studentId === student.id);

  // Timeline events
  const timelines = (db.studentTimelines || []).filter((t) => t.studentId === student.id);

  // Fee & Ledger Calculations
  const studentPayments = (db.payments || []).filter((p) => p.studentId === student.id);
  const lockedFee = student.lockedCourseFee || course?.price || 15000;
  const totalPaid = studentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const dueBalance = Math.max(0, lockedFee - totalPaid);
  const daysSinceAdmission = Math.round((new Date() - new Date(student.admissionDate || Date.now())) / (1000 * 60 * 60 * 24));
  const isOverdue = dueBalance > 0 && daysSinceAdmission > 30;

  // Course Progress Calculation (Days Completed vs Days Remaining)
  const admissionDateStr = student.admissionDate || grp?.startDate || '2026-09-01';
  const expectedEndStr = student.expectedEndDate || grp?.expectedEndDate || '2026-12-17';

  const admissionDate = new Date(admissionDateStr);
  const endDate = new Date(expectedEndStr);
  const today = new Date();

  const totalCourseDays = Math.max(1, Math.round((endDate - admissionDate) / (1000 * 60 * 60 * 24)));
  const daysCompleted = Math.max(0, Math.min(totalCourseDays, Math.round((today - admissionDate) / (1000 * 60 * 60 * 24))));
  const daysRemaining = Math.max(0, totalCourseDays - daysCompleted);
  const courseProgressPercent = Math.min(100, Math.max(0, Math.round((daysCompleted / totalCourseDays) * 100)));

  // Trainee Initials
  const nameParts = (student.name || '').trim().split(' ');
  const initials = nameParts.length >= 2
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    : (student.name || 'S').slice(0, 2).toUpperCase();

  // Add Note handler
  const handleAddNote = () => {
    if (!newNoteText.trim()) return;

    const newNote = {
      id: `NOTE-${Date.now()}`,
      studentId: student.id,
      text: newNoteText.trim(),
      author: 'Trainer / Staff',
      createdAt: new Date().toISOString()
    };

    let nextDb = {
      ...db,
      studentNotes: [newNote, ...(db.studentNotes || [])]
    };

    nextDb = logAudit(
      nextDb,
      'CREATE',
      'StudentNote',
      newNote.id,
      `Note added to student ${student.name} (${student.tgid}): "${newNoteText.trim().slice(0, 40)}..."`,
      'Staff'
    );

    saveDB(nextDb);
    setDb(nextDb);
    setNewNoteText('');
  };

  // Delete Note handler
  const handleDeleteNote = (noteId) => {
    let nextDb = {
      ...db,
      studentNotes: (db.studentNotes || []).filter((n) => n.id !== noteId)
    };
    saveDB(nextDb);
    setDb(nextDb);
  };

  // OJT Dialog Handlers
  const handleOpenAddOjt = () => {
    const defaultEmp = ojtEmployer || (db.employers || [])[0];
    setOjtForm({
      employerId: ojt?.employerId || defaultEmp?.id || '',
      startDate: ojt?.startDate || new Date().toISOString().slice(0, 10),
      endDate: ojt?.endDate || '',
      relatedPerson: ojt?.relatedPerson || defaultEmp?.contactPerson || '',
      contactNumber: ojt?.contactNumber || defaultEmp?.phone || '',
      status: ojt?.status || 'Ongoing',
      remarks: ojt?.remarks || ''
    });
    setOpenOjtDialog(true);
  };

  const handleOjtEmployerSelect = (empId) => {
    const selectedEmp = (db.employers || []).find((e) => e.id === empId);
    setOjtForm((prev) => ({
      ...prev,
      employerId: empId,
      relatedPerson: selectedEmp?.contactPerson || prev.relatedPerson,
      contactNumber: selectedEmp?.phone || prev.contactNumber
    }));
  };

  const handleSaveOjt = () => {
    if (!ojtForm.employerId || !ojtForm.startDate) {
      alert('Employer and Start Date are required.');
      return;
    }
    const emp = (db.employers || []).find((e) => e.id === ojtForm.employerId);
    const existingIndex = (db.ojts || []).findIndex((o) => o.studentId === student.id);
    let updatedOjts = [...(db.ojts || [])];

    const ojtRecord = {
      id: existingIndex >= 0 ? updatedOjts[existingIndex].id : `OJT-${Date.now()}`,
      studentId: student.id,
      ...ojtForm
    };

    if (existingIndex >= 0) {
      updatedOjts[existingIndex] = ojtRecord;
    } else {
      updatedOjts.push(ojtRecord);
    }

    const updatedStudents = (db.students || []).map((s) =>
      s.id === student.id ? { ...s, status: 'OJT' } : s
    );

    const timelineEntry = {
      id: `TL-${Date.now()}`,
      studentId: student.id,
      eventType: 'OJT',
      title: `OJT Assigned: ${emp?.name || 'Partner Host'}`,
      description: `Deployed for On-the-Job Training from ${ojtForm.startDate} to ${ojtForm.endDate || 'TBD'} under ${ojtForm.relatedPerson || 'Supervisor'}.`,
      createdAt: new Date().toISOString()
    };

    let nextDb = {
      ...db,
      ojts: updatedOjts,
      students: updatedStudents,
      studentTimelines: [timelineEntry, ...(db.studentTimelines || [])]
    };

    nextDb = logAudit(
      nextDb,
      existingIndex >= 0 ? 'UPDATE' : 'CREATE',
      'OJT',
      ojtRecord.id,
      `OJT ${existingIndex >= 0 ? 'updated' : 'assigned'} for ${student.name} at ${emp?.name}`,
      'Staff'
    );

    saveDB(nextDb);
    setDb(nextDb);
    setOpenOjtDialog(false);
  };

  // Placement (EPP) Dialog Handlers
  const handleOpenAddPlacement = () => {
    const defaultEmp = placementEmployer || (db.employers || [])[0];
    setPlacementForm({
      employerId: placement?.employerId || defaultEmp?.id || '',
      targetJob: placement?.targetJob || `${course?.title || 'Caregiver'} Specialist`,
      preferredLocation: placement?.preferredLocation || defaultEmp?.location || 'Kathmandu',
      expectedSalary: placement?.expectedSalary || 'NPR 25,000 / month',
      employmentType: placement?.employmentType || 'Full-Time Employee',
      workSchedule: placement?.workSchedule || '09:00 AM – 05:00 PM',
      paymentType: placement?.paymentType || 'Monthly Salary',
      placementDate: placement?.placementDate || new Date().toISOString().slice(0, 10),
      status: placement?.status || 'Placed',
      remarks: placement?.remarks || ''
    });
    setOpenPlacementDialog(true);
  };

  const handlePlacementEmployerSelect = (empId) => {
    const selectedEmp = (db.employers || []).find((e) => e.id === empId);
    setPlacementForm((prev) => ({
      ...prev,
      employerId: empId,
      preferredLocation: selectedEmp?.location || prev.preferredLocation
    }));
  };

  const handleSavePlacement = () => {
    if (!placementForm.employerId || !placementForm.targetJob) {
      alert('Employer and Target Job Role are required.');
      return;
    }
    const emp = (db.employers || []).find((e) => e.id === placementForm.employerId);
    const existingIndex = (db.placements || []).findIndex((p) => p.studentId === student.id);
    let updatedPlacements = [...(db.placements || [])];

    const placementRecord = {
      id: existingIndex >= 0 ? updatedPlacements[existingIndex].id : `PLC-${Date.now()}`,
      studentId: student.id,
      ...placementForm
    };

    if (existingIndex >= 0) {
      updatedPlacements[existingIndex] = placementRecord;
    } else {
      updatedPlacements.push(placementRecord);
    }

    const updatedStudents = (db.students || []).map((s) =>
      s.id === student.id ? { ...s, status: 'Placed' } : s
    );

    const timelineEntry = {
      id: `TL-${Date.now()}`,
      studentId: student.id,
      eventType: 'Placement',
      title: `Job Placement: ${emp?.name || 'Recruiting Partner'}`,
      description: `Hired as ${placementForm.targetJob} (${placementForm.employmentType}) with salary ${placementForm.expectedSalary}.`,
      createdAt: new Date().toISOString()
    };

    let nextDb = {
      ...db,
      placements: updatedPlacements,
      students: updatedStudents,
      studentTimelines: [timelineEntry, ...(db.studentTimelines || [])]
    };

    nextDb = logAudit(
      nextDb,
      existingIndex >= 0 ? 'UPDATE' : 'CREATE',
      'Placement',
      placementRecord.id,
      `Job Placement recorded for ${student.name} at ${emp?.name} as ${placementForm.targetJob}`,
      'Staff'
    );

    saveDB(nextDb);
    setDb(nextDb);
    setOpenPlacementDialog(false);
  };


  const tabsList = ['Profile', 'Fees', 'Attendance', 'Evaluation', 'OJT', 'EPP', 'Notes'];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          overflow: 'hidden',
          bgcolor: '#f8fafc',
          boxShadow: '0 20px 40px rgba(0,0,0,0.12)'
        }
      }}
    >
      {/* Top App Bar with back navigation & menu */}
      <Box
        sx={{
          px: 2.5,
          py: 1.8,
          bgcolor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={onClose} sx={{ color: '#0f172a' }}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.15rem' }}>
            Student Profile
          </Typography>
        </Box>

        <IconButton
          size="small"
          onClick={(e) => setMenuAnchorEl(e.currentTarget)}
          sx={{ color: '#64748b' }}
        >
          <MoreVertIcon />
        </IconButton>

        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={() => setMenuAnchorEl(null)}
          PaperProps={{ sx: { borderRadius: 2.5, minWidth: 180 } }}
        >
          <MenuItem
            onClick={() => {
              setMenuAnchorEl(null);
              if (onOpenIdCard) onOpenIdCard(student);
            }}
          >
            <QrCode2Icon fontSize="small" sx={{ mr: 1, color: '#1a56b0' }} />
            Print ID Card
          </MenuItem>
          {student.phone && (
            <MenuItem
              component="a"
              href={getWhatsAppUrl(student.phone, `Namaste ${student.name}, regarding your training at Global Era Technical School.`)}
              target="_blank"
              onClick={() => setMenuAnchorEl(null)}
            >
              <WhatsAppIcon fontSize="small" sx={{ mr: 1, color: '#25D366' }} />
              WhatsApp Student
            </MenuItem>
          )}
          {student.guardianContact && (
            <MenuItem
              component="a"
              href={getWhatsAppUrl(student.guardianContact, `Namaste, regarding trainee ${student.name} at Global Era Technical School.`)}
              target="_blank"
              onClick={() => setMenuAnchorEl(null)}
            >
              <WhatsAppIcon fontSize="small" sx={{ mr: 1, color: '#25D366' }} />
              WhatsApp Guardian
            </MenuItem>
          )}
          <MenuItem
            onClick={() => {
              setMenuAnchorEl(null);
              onClose();
              if (onEditStudent) onEditStudent(student);
            }}
          >
            <EditIcon fontSize="small" sx={{ mr: 1, color: '#475569' }} />
            Edit Profile
          </MenuItem>
        </Menu>
      </Box>

      {/* Main Body Content */}
      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* 1. Student Header Card */}
        <Card
          sx={{
            p: 2.5,
            borderRadius: 3.5,
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: { xs: 'wrap', sm: 'nowrap' }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Avatar
              src={student.photoUrl || undefined}
              sx={{
                width: 64,
                height: 64,
                borderRadius: 3,
                bgcolor: '#e0edff',
                color: '#1a56b0',
                fontWeight: 900,
                fontSize: '1.4rem'
              }}
            >
              {initials}
            </Avatar>

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                {student.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mt: 0.3 }}>
                {student.tgid}
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', mt: 0.5 }}>
                {course?.title || 'Care Giver level 1'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, display: 'block' }}>
                {grp?.groupCode || 'A'} • {grp?.startTime || '07:00 AM'} – {grp?.endTime || '09:00 AM'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ alignSelf: { xs: 'flex-start', sm: 'flex-start' } }}>
            <Chip
              label={student.status || 'Active'}
              sx={{
                bgcolor:
                  student.status === 'Active'
                    ? '#e6f9ed'
                    : student.status === 'Completed'
                    ? '#e0edff'
                    : student.status === 'Placed'
                    ? '#dcfce7'
                    : '#fef3c7',
                color:
                  student.status === 'Active'
                    ? '#15803d'
                    : student.status === 'Completed'
                    ? '#1a56b0'
                    : student.status === 'Placed'
                    ? '#166534'
                    : '#b45309',
                fontWeight: 800,
                fontSize: '0.8rem',
                borderRadius: 99,
                px: 1,
                py: 0.4
              }}
            />
          </Box>
        </Card>

        {/* 2. Course Progress Card */}
        <Card
          sx={{
            p: 2.5,
            mt: 2,
            borderRadius: 3.5,
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoStoriesIcon sx={{ color: '#1a56b0', fontSize: '1.25rem' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Course Progress
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#1a56b0' }}>
              {courseProgressPercent}%
            </Typography>
          </Box>

          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 1.2 }}>
            {courseProgressPercent >= 100 ? 'Completed' : 'Ongoing'}
          </Typography>

          <LinearProgress
            variant="determinate"
            value={courseProgressPercent}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: '#e2e8f0',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#1a56b0',
                borderRadius: 4
              }
            }}
          />

          <Grid container spacing={1.5} sx={{ mt: 2 }}>
            <Grid item xs={4}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  textAlign: 'center',
                  borderRadius: 2.5,
                  bgcolor: '#f8fafc',
                  border: '1px solid #f1f5f9'
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>
                  {daysCompleted}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Days Completed
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={4}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  textAlign: 'center',
                  borderRadius: 2.5,
                  bgcolor: '#f8fafc',
                  border: '1px solid #f1f5f9'
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>
                  {daysRemaining}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Days Remaining
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={4}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  textAlign: 'center',
                  borderRadius: 2.5,
                  bgcolor: '#f8fafc',
                  border: '1px solid #f1f5f9'
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                  {expectedEndStr}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  End Date
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Card>

        {/* 3. Navigation Tab Pills */}
        <Card
          sx={{
            p: 0.8,
            mt: 2,
            borderRadius: 3.5,
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            '&::-webkit-scrollbar': { height: 4 }
          }}
        >
          {tabsList.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Button
                key={tab}
                size="small"
                onClick={() => setActiveTab(tab)}
                sx={{
                  px: 2.2,
                  py: 0.8,
                  borderRadius: 2.2,
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  textTransform: 'none',
                  bgcolor: isActive ? '#e0edff' : 'transparent',
                  color: isActive ? '#1a56b0' : '#64748b',
                  '&:hover': {
                    bgcolor: isActive ? '#e0edff' : '#f1f5f9'
                  }
                }}
              >
                {tab}
              </Button>
            );
          })}
        </Card>

        {/* 4. Tab Content Panels */}
        <Box sx={{ mt: 2 }}>
          {/* TAB 1: Profile (Personal Information) */}
          {activeTab === 'Profile' && (
            <Card
              sx={{
                p: 2.5,
                borderRadius: 3.5,
                bgcolor: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PersonIcon sx={{ color: '#1a56b0', fontSize: '1.3rem' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Personal Information
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>FULL NAME</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>{student.name}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>STUDENT / ROLL ID</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a56b0' }}>{student.tgid}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>PRIMARY PHONE</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{student.phone}</Typography>
                    {student.phone && (
                      <IconButton
                        size="small"
                        component="a"
                        href={getWhatsAppUrl(student.phone, `Namaste ${student.name}`)}
                        target="_blank"
                        sx={{ color: '#25D366', p: 0.2 }}
                      >
                        <WhatsAppIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>SECONDARY / GUARDIAN PHONE</Typography>
                  <Typography variant="body2">{student.secondaryPhone || student.guardianContact || '—'}</Typography>
                </Grid>

                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>GENDER</Typography>
                  <Typography variant="body2">{student.gender || 'Female'}</Typography>
                </Grid>

                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>DATE OF BIRTH</Typography>
                  <Typography variant="body2">{student.dateOfBirth || '—'}</Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>CITIZENSHIP NO & DISTRICT</Typography>
                  <Typography variant="body2">{student.citizenshipNumber || '—'} ({student.citizenshipDistrict || 'Nepal'})</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>PERMANENT ADDRESS</Typography>
                  <Typography variant="body2">{student.permanentAddress || '—'}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>CURRENT ADDRESS</Typography>
                  <Typography variant="body2">{student.currentAddress || '—'}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>FATHER & MOTHER NAME</Typography>
                  <Typography variant="body2">
                    {student.fatherName ? `Father: ${student.fatherName}` : ''}{student.motherName ? ` • Mother: ${student.motherName}` : '—'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>ADMISSION & EXPECTED END</Typography>
                  <Typography variant="body2">{admissionDateStr} → {expectedEndStr}</Typography>
                </Grid>
              </Grid>

              {/* Group & Trainer Box */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mt: 2.5,
                  borderRadius: 2.5,
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0'
                }}
              >
                <Typography variant="caption" sx={{ color: '#1a56b0', fontWeight: 800, textTransform: 'uppercase' }}>
                  Assigned Training Batch & Lead Instructor
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.8, flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      Group {grp?.groupCode} • Shift {grp?.shift} ({grp?.startTime} – {grp?.endTime})
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Lead Trainer: {trainer?.name || 'Assigned Instructor'} • Phone: {trainer?.phone || '—'}
                    </Typography>
                  </Box>
                  {trainer?.phone && (
                    <IconButton
                      size="small"
                      component="a"
                      href={getWhatsAppUrl(trainer.phone, `Namaste Trainer ${trainer.name}, inquiry regarding trainee ${student.name} (${student.tgid}).`)}
                      target="_blank"
                      sx={{ color: '#25D366' }}
                    >
                      <WhatsAppIcon />
                    </IconButton>
                  )}
                </Box>
              </Paper>
            </Card>
          )}

          {/* TAB: Fees & Accounts */}
          {activeTab === 'Fees' && (
            <Card
              sx={{
                p: 2.5,
                borderRadius: 3.5,
                bgcolor: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  💰 Fee & Ledger Overview (शुल्क तथा खाता विवरण)
                </Typography>
                <Chip
                  label={dueBalance === 0 ? 'Fully Paid (सम्पूर्ण चुक्ता)' : isOverdue ? 'Overdue (>30 Days)' : totalPaid > 0 ? 'Partial Payment (आंशिक)' : 'Unpaid (बाँकी)'}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    bgcolor: dueBalance === 0 ? '#e5f8ee' : isOverdue ? '#fee2e2' : totalPaid > 0 ? '#fef3c7' : '#fee2e2',
                    color: dueBalance === 0 ? '#16834b' : isOverdue ? '#dc2626' : totalPaid > 0 ? '#b45309' : '#dc2626'
                  }}
                />
              </Box>

              {/* Fee Stats */}
              <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>Total Course Fee (कुल शुल्क)</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', mt: 0.5 }}>
                      Rs. {lockedFee.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>Course Package Fee</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e5f8ee', borderRadius: 2.5, border: '1px solid #bbf7d0' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#16834b' }}>Total Paid (बुझाएको रकम)</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#16834b', mt: 0.5 }}>
                      Rs. {totalPaid.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#16834b' }}>
                      {Math.round((totalPaid / (lockedFee || 1)) * 100)}% Cleared
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: dueBalance > 0 ? '#fef2f2' : '#f8fafc', borderRadius: 2.5, border: dueBalance > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: dueBalance > 0 ? '#dc2626' : '#64748b' }}>Due Balance (बाँकी रकम)</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: dueBalance > 0 ? '#dc2626' : '#16834b', mt: 0.5 }}>
                      Rs. {dueBalance.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: dueBalance > 0 ? '#dc2626' : '#16834b' }}>
                      {dueBalance === 0 ? 'No pending balance' : isOverdue ? 'Overdue pending (>30D)' : 'Installment active'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Transactions / Receipts List */}
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#334155', mb: 1.5 }}>
                🧾 Payment Receipts & Audit Trail (रसिदहरू):
              </Typography>
              {studentPayments.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                    कुनै भुक्तानी रसिद फेला परेन (No payment receipts recorded yet for this student).
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={1.5}>
                  {studentPayments.map((p) => (
                    <Paper
                      key={p.id}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 1
                      }}
                    >
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a56b0' }}>
                            {p.receiptNo || p.id}
                          </Typography>
                          <Chip label={p.paymentMethod || 'Cash'} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                          <Chip label={p.installmentType || 'Installment'} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                        </Box>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.3 }}>
                          Date: {p.date} • Collected By: {p.collectedBy || 'Finance Desk'} {p.remarks ? `• ${p.remarks}` : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#16834b' }}>
                          Rs. {Number(p.amount).toLocaleString()}
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PrintIcon />}
                          onClick={() => setSelectedReceiptPayment(p)}
                          sx={{ textTransform: 'none', fontWeight: 700 }}
                        >
                          Print Receipt
                        </Button>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Card>
          )}

          {/* TAB 2: Attendance */}
          {activeTab === 'Attendance' && (
            <Card
              sx={{
                p: 2.5,
                borderRadius: 3.5,
                bgcolor: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
                📊 Attendance Summary
              </Typography>

              <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid item xs={4}>
                  <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#e5f8ee', borderRadius: 2.5 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#16834b' }}>{presentCount}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#16834b' }}>Days Present</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#fdeceb', borderRadius: 2.5 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#d5372f' }}>{absentCount}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#d5372f' }}>Days Absent</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#fff7df', borderRadius: 2.5 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#c9820a' }}>{lateCount}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#c9820a' }}>Days Late</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Attendance Rate</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#1a56b0' }}>{attendanceRate}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={attendanceRate} sx={{ height: 8, borderRadius: 4 }} />
              </Box>

              <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 3, mb: 1.5 }}>
                Recent Attendance Sessions:
              </Typography>
              {attendances.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center', py: 2 }}>
                  No attendance records recorded yet.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {attendances.slice(0, 5).map((att) => (
                    <Paper
                      key={att.id}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          Date: {att.date}
                        </Typography>
                        {att.remarks && (
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Remarks: {att.remarks}
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        size="small"
                        label={att.status === 'present' || att.status === 'P' ? 'Present' : att.status === 'absent' || att.status === 'A' ? 'Absent' : 'Late'}
                        sx={{
                          fontWeight: 800,
                          bgcolor: att.status === 'present' || att.status === 'P' ? '#e5f8ee' : att.status === 'absent' || att.status === 'A' ? '#fdeceb' : '#fff7df',
                          color: att.status === 'present' || att.status === 'P' ? '#16834b' : att.status === 'absent' || att.status === 'A' ? '#d5372f' : '#c9820a'
                        }}
                      />
                    </Paper>
                  ))}
                </Stack>
              )}
            </Card>
          )}

          {/* TAB 3: Evaluation */}
          {activeTab === 'Evaluation' && (
            <Card
              sx={{
                p: 2.5,
                borderRadius: 3.5,
                bgcolor: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
                🎯 CTEVT Competency & Skill Evaluation
              </Typography>

              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
                Units Mastered: <b>{masteredUnits.length}</b> of <b>{syllabi.length}</b> curriculum units.
              </Typography>

              <Stack spacing={1.5}>
                {syllabi.map((syl) => {
                  const ev = evaluations.find((e) => e.syllabusId === syl.id);
                  const isMastered = Boolean(ev?.mastered);
                  return (
                    <Paper
                      key={syl.id}
                      variant="outlined"
                      sx={{
                        p: 1.8,
                        borderRadius: 2.5,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 1
                      }}
                    >
                      <Box sx={{ maxWidth: '75%' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          Unit {syl.unitNo}: {syl.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                          {syl.totalHours} Hours • {syl.learningOutcome}
                        </Typography>
                        {ev?.remarks && (
                          <Typography variant="caption" sx={{ color: '#1a56b0', fontStyle: 'italic' }}>
                            Trainer Remark: {ev.remarks}
                          </Typography>
                        )}
                      </Box>
                      {isMastered ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Mastered"
                          size="small"
                          color="success"
                          sx={{ fontWeight: 800 }}
                        />
                      ) : (
                        <Chip
                          icon={<HourglassEmptyIcon />}
                          label="In Progress"
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 700 }}
                        />
                      )}
                    </Paper>
                  );
                })}
              </Stack>
            </Card>
          )}

          {/* TAB 4: OJT */}
          {activeTab === 'OJT' && (
            <Card
              sx={{
                p: 2.5,
                borderRadius: 3.5,
                bgcolor: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    🏢 On-the-Job Training (OJT)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    व्यावहारिक कार्यस्थल अभ्यास तथा उद्योग सहकार्य
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip
                    label={ojt?.status || 'Not Assigned'}
                    sx={{
                      bgcolor: ojt?.status === 'Completed' ? '#e5f8ee' : ojt ? '#e0edff' : '#f1f5f9',
                      color: ojt?.status === 'Completed' ? '#16834b' : ojt ? '#1a56b0' : '#64748b',
                      fontWeight: 800
                    }}
                  />
                  <Button
                    size="small"
                    variant={ojt ? 'outlined' : 'contained'}
                    startIcon={ojt ? <EditIcon /> : <AddIcon />}
                    onClick={handleOpenAddOjt}
                    sx={{
                      fontWeight: 800,
                      textTransform: 'none',
                      borderRadius: 2,
                      bgcolor: ojt ? 'transparent' : '#1a56b0',
                      color: ojt ? '#1a56b0' : '#fff'
                    }}
                  >
                    {ojt ? 'Edit OJT' : '+ Assign OJT'}
                  </Button>
                </Box>
              </Box>

              {ojt ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>HOST EMPLOYER (रोजगारदाता)</Typography>
                    <Box
                      onClick={() => ojtEmployer && setViewEmployerDetails(ojtEmployer)}
                      sx={{
                        cursor: ojtEmployer ? 'pointer' : 'default',
                        p: 1.2,
                        mt: 0.5,
                        borderRadius: 2,
                        bgcolor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        '&:hover': { bgcolor: ojtEmployer ? '#f1f5f9' : '#f8fafc' }
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a56b0' }}>
                        {ojtEmployer?.name || 'Partner Host'} 🔗
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {ojtEmployer?.location} • {ojtEmployer?.industry}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>OJT SUPERVISOR & PHONE</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {ojt.relatedPerson || ojtEmployer?.contactPerson || 'Supervisor'} ({ojt.contactNumber || ojtEmployer?.phone || '—'})
                      </Typography>
                      {ojt.contactNumber && (
                        <IconButton
                          size="small"
                          component="a"
                          href={getWhatsAppUrl(ojt.contactNumber, `Namaste Supervisor, regarding student ${student.name} on OJT.`)}
                          target="_blank"
                          sx={{ color: '#25D366', p: 0.2 }}
                        >
                          <WhatsAppIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>OJT DURATION</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {ojt.startDate} → {ojt.endDate || 'Ongoing'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>SUPERVISOR REMARKS / TASKS</Typography>
                    <Typography variant="body2" sx={{ color: '#334155', mt: 0.5 }}>
                      {ojt.remarks || 'Practical hands-on training under designated trade mentor.'}
                    </Typography>
                  </Grid>
                </Grid>
              ) : (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <WorkIcon sx={{ fontSize: 44, color: '#94a3b8', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mb: 2 }}>
                    No active On-the-Job Training deployment recorded yet.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddOjt}
                    sx={{
                      fontWeight: 800,
                      textTransform: 'none',
                      borderRadius: 2.5,
                      bgcolor: '#1a56b0',
                      px: 3,
                      py: 1
                    }}
                  >
                    + Assign OJT (कार्यस्थल अभ्यास दर्ता)
                  </Button>
                </Box>
              )}
            </Card>
          )}

          {/* TAB 5: EPP */}
          {activeTab === 'EPP' && (
            <Card
              sx={{
                p: 2.5,
                borderRadius: 3.5,
                bgcolor: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    💼 Job Placement (EPP)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    रोजगारी तथा श्रम बजार संलग्नता
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip
                    label={placement?.status || 'Seeking'}
                    sx={{
                      bgcolor: placement?.status === 'Placed' ? '#e5f8ee' : '#fff7df',
                      color: placement?.status === 'Placed' ? '#16834b' : '#c9820a',
                      fontWeight: 800
                    }}
                  />
                  <Button
                    size="small"
                    variant={placement ? 'outlined' : 'contained'}
                    startIcon={placement ? <EditIcon /> : <AddIcon />}
                    onClick={handleOpenAddPlacement}
                    sx={{
                      fontWeight: 800,
                      textTransform: 'none',
                      borderRadius: 2,
                      bgcolor: placement ? 'transparent' : '#16834b',
                      color: placement ? '#16834b' : '#fff',
                      '&:hover': { bgcolor: placement ? '#f0fdf4' : '#15803d' }
                    }}
                  >
                    {placement ? 'Edit Placement' : '+ Record Placement'}
                  </Button>
                </Box>
              </Box>

              {placement ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>EMPLOYER / COMPANY (रोजगारदाता)</Typography>
                    <Box
                      onClick={() => placementEmployer && setViewEmployerDetails(placementEmployer)}
                      sx={{
                        cursor: placementEmployer ? 'pointer' : 'default',
                        p: 1.2,
                        mt: 0.5,
                        borderRadius: 2,
                        bgcolor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        '&:hover': { bgcolor: placementEmployer ? '#f1f5f9' : '#f8fafc' }
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#16834b' }}>
                        {placementEmployer?.name || 'Recruiting Partner'} 🔗
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {placement.preferredLocation || placementEmployer?.location || 'Kathmandu'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>TARGET JOB & TYPE</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {placement.targetJob} • {placement.employmentType || 'Full-time'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>MONTHLY SALARY / STIPEND</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#16834b', mt: 0.5 }}>
                      {placement.expectedSalary || 'Negotiated'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>WORK SCHEDULE / PLACEMENT DATE</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {placement.workSchedule || 'Full-time'} (Date: {placement.placementDate || '—'})
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>REMARKS</Typography>
                    <Typography variant="body2" sx={{ color: '#334155', mt: 0.5 }}>
                      {placement.remarks || 'Placement coordination in progress.'}
                    </Typography>
                  </Grid>
                </Grid>
              ) : (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <BusinessIcon sx={{ fontSize: 44, color: '#94a3b8', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mb: 2 }}>
                    Student is currently preparing for post-training job placement.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddPlacement}
                    sx={{
                      fontWeight: 800,
                      textTransform: 'none',
                      borderRadius: 2.5,
                      bgcolor: '#16834b',
                      px: 3,
                      py: 1,
                      '&:hover': { bgcolor: '#15803d' }
                    }}
                  >
                    + Record Job Placement (रोजगारी / EPP दर्ता)
                  </Button>
                </Box>
              )}
            </Card>
          )}

          {/* TAB 6: Notes (EXACTLY MATCHING USER SCREENSHOT 2) */}
          {activeTab === 'Notes' && (
            <Card
              sx={{
                p: 2.5,
                borderRadius: 3.5,
                bgcolor: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                📝 Notes & Timeline
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 2 }}>
                {studentNotes.length} note(s)
              </Typography>

              {/* Note List / Empty State */}
              {studentNotes.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                    No notes yet
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5} sx={{ mb: 2.5 }}>
                  {studentNotes.map((note) => (
                    <Paper
                      key={note.id}
                      variant="outlined"
                      sx={{
                        p: 1.8,
                        borderRadius: 2.5,
                        bgcolor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        position: 'relative'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="body2" sx={{ color: '#1e293b', whiteSpace: 'pre-wrap', pr: 4 }}>
                          {note.text}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteNote(note.id)}
                          sx={{ color: '#94a3b8', position: 'absolute', top: 8, right: 8 }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
                        <Typography variant="caption" sx={{ color: '#1a56b0', fontWeight: 700 }}>
                          {note.author || 'Trainer'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          • {new Date(note.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              )}

              {/* Add Note Input Area (Matches Screenshot 2) */}
              <Box sx={{ mt: 2 }}>
                <TextField
                  multiline
                  rows={3}
                  placeholder="Write a note..."
                  fullWidth
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  sx={{
                    bgcolor: '#ffffff',
                    borderRadius: 2.5,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2.5
                    }
                  }}
                />

                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleAddNote}
                  sx={{
                    mt: 1.5,
                    py: 1.2,
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    bgcolor: '#1a56b0',
                    borderRadius: 2.5,
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(26,86,176,0.25)',
                    '&:hover': {
                      bgcolor: '#15448d'
                    }
                  }}
                >
                  + Add Note
                </Button>
              </Box>
            </Card>
          )}
        </Box>
      </DialogContent>

      {/* Bottom Sticky Actions (Matches Both Screenshots) */}
      <Box
        sx={{
          p: 2,
          px: { xs: 2, sm: 3 },
          bgcolor: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          gap: 1.5
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            flex: 1,
            py: 1.2,
            bgcolor: '#f1f5f9',
            color: '#334155',
            fontWeight: 800,
            fontSize: '0.95rem',
            borderRadius: 2.5,
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#e2e8f0'
            }
          }}
        >
          Close
        </Button>

        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => {
            onClose();
            if (onEditStudent) onEditStudent(student);
          }}
          sx={{
            flex: 1,
            py: 1.2,
            bgcolor: '#1a56b0',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.95rem',
            borderRadius: 2.5,
            textTransform: 'none',
            boxShadow: '0 4px 12px rgba(26,86,176,0.25)',
            '&:hover': {
              bgcolor: '#15448d'
            }
          }}
        >
          Edit Profile
        </Button>
      </Box>

      {/* Assign / Edit OJT Sub-Dialog */}
      <Dialog open={openOjtDialog} onClose={() => setOpenOjtDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {ojt ? 'Edit OJT Assignment' : `Assign OJT for ${student.name}`}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Select Host Employer (रोजगारदाता संस्था)"
              fullWidth
              value={ojtForm.employerId}
              onChange={(e) => handleOjtEmployerSelect(e.target.value)}
              required
            >
              {(db.employers || []).map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  <b>{emp.name}</b> — {emp.industry} ({emp.location})
                </MenuItem>
              ))}
            </TextField>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="Start Date (सुरु मिति)"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={ojtForm.startDate}
                  onChange={(e) => setOjtForm({ ...ojtForm, startDate: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="End Date (सम्पन्न मिति)"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={ojtForm.endDate}
                  onChange={(e) => setOjtForm({ ...ojtForm, endDate: e.target.value })}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Supervisor Name (सुपरभाइजर)"
                  fullWidth
                  value={ojtForm.relatedPerson}
                  onChange={(e) => setOjtForm({ ...ojtForm, relatedPerson: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Supervisor Phone (फोन)"
                  fullWidth
                  value={ojtForm.contactNumber}
                  onChange={(e) => setOjtForm({ ...ojtForm, contactNumber: e.target.value })}
                />
              </Grid>
            </Grid>

            <TextField
              select
              label="Status (अवस्था)"
              fullWidth
              value={ojtForm.status}
              onChange={(e) => setOjtForm({ ...ojtForm, status: e.target.value })}
            >
              <MenuItem value="Ongoing">Ongoing (सञ्चालनमा)</MenuItem>
              <MenuItem value="Planned">Planned (योजना गरिएको)</MenuItem>
              <MenuItem value="Completed">Completed (सम्पन्न)</MenuItem>
            </TextField>

            <TextField
              label="Department / Tasks Remarks (विभाग तथा टिपोट)"
              fullWidth
              multiline
              rows={2}
              value={ojtForm.remarks}
              onChange={(e) => setOjtForm({ ...ojtForm, remarks: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenOjtDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveOjt} sx={{ fontWeight: 800, bgcolor: '#1a56b0' }}>
            Save OJT Assignment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Record / Edit Placement (EPP) Sub-Dialog */}
      <Dialog open={openPlacementDialog} onClose={() => setOpenPlacementDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {placement ? 'Edit Job Placement (EPP)' : `Record Job Placement for ${student.name}`}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Select Employer / Recruiting Partner (रोजगारदाता)"
              fullWidth
              value={placementForm.employerId}
              onChange={(e) => handlePlacementEmployerSelect(e.target.value)}
              required
            >
              {(db.employers || []).map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  <b>{emp.name}</b> — {emp.industry} ({emp.location})
                </MenuItem>
              ))}
            </TextField>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Target Job Role / Designation (पद)"
                  fullWidth
                  value={placementForm.targetJob}
                  onChange={(e) => setPlacementForm({ ...placementForm, targetJob: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Employment Type (रोजगारीको प्रकार)"
                  fullWidth
                  value={placementForm.employmentType}
                  onChange={(e) => setPlacementForm({ ...placementForm, employmentType: e.target.value })}
                >
                  <MenuItem value="Full-Time Employee">Full-Time Employee</MenuItem>
                  <MenuItem value="Part-Time Employee">Part-Time Employee</MenuItem>
                  <MenuItem value="Foreign Employment">Foreign Employment (वैदेशिक)</MenuItem>
                  <MenuItem value="Contract Based">Contract Based</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Monthly Salary / Income (मासिक तलब)"
                  fullWidth
                  value={placementForm.expectedSalary}
                  onChange={(e) => setPlacementForm({ ...placementForm, expectedSalary: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="Placement Date (नियुक्ति मिति)"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={placementForm.placementDate}
                  onChange={(e) => setPlacementForm({ ...placementForm, placementDate: e.target.value })}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Work Schedule / Shift"
                  fullWidth
                  value={placementForm.workSchedule}
                  onChange={(e) => setPlacementForm({ ...placementForm, workSchedule: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Placement Status"
                  fullWidth
                  value={placementForm.status}
                  onChange={(e) => setPlacementForm({ ...placementForm, status: e.target.value })}
                >
                  <MenuItem value="Placed">Placed (नियुक्त भएको)</MenuItem>
                  <MenuItem value="Interview Scheduled">Interview Scheduled</MenuItem>
                  <MenuItem value="Offer Issued">Offer Issued</MenuItem>
                  <MenuItem value="Seeking">Seeking</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <TextField
              label="Remarks / Notes (टिपोट)"
              fullWidth
              multiline
              rows={2}
              value={placementForm.remarks}
              onChange={(e) => setPlacementForm({ ...placementForm, remarks: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenPlacementDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePlacement} sx={{ fontWeight: 800, bgcolor: '#16834b' }}>
            Save Placement Record
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quick Employer Details View Dialog */}
      <Dialog open={Boolean(viewEmployerDetails)} onClose={() => setViewEmployerDetails(null)} maxWidth="xs" fullWidth>
        {viewEmployerDetails && (
          <>
            <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon sx={{ color: '#1a56b0' }} />
              {viewEmployerDetails.name}
            </DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>SECTOR / INDUSTRY</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{viewEmployerDetails.industry}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>LOCATION</Typography>
                  <Typography variant="body2">{viewEmployerDetails.location}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>CONTACT PERSON & PHONE</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{viewEmployerDetails.contactPerson} ({viewEmployerDetails.phone})</Typography>
                </Box>
                {viewEmployerDetails.email && (
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>EMAIL</Typography>
                    <Typography variant="body2">{viewEmployerDetails.email}</Typography>
                  </Box>
                )}
                {viewEmployerDetails.remarks && (
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>MOU / REMARKS</Typography>
                    <Typography variant="body2" sx={{ color: '#475569' }}>{viewEmployerDetails.remarks}</Typography>
                  </Box>
                )}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setViewEmployerDetails(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Official Dual-Format Receipt Modal (A4 & Thermal 80mm) */}
      {selectedReceiptPayment && (
        <ReceiptModal
          open={Boolean(selectedReceiptPayment)}
          onClose={() => setSelectedReceiptPayment(null)}
          payment={selectedReceiptPayment}
          student={student}
          group={grp}
          course={course}
          settings={db.settings}
        />
      )}
    </Dialog>
  );
}
