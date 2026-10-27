import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Grid,
  Chip,
  Button,
  Avatar,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Stack,
  Divider,
  Badge
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import WorkIcon from '@mui/icons-material/Work';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import SendIcon from '@mui/icons-material/Send';
import VisibilityIcon from '@mui/icons-material/Visibility';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../context/AuthContext';
import { loadDB, saveDB } from '../../services/storage';
import A4LandscapeCertificateModal from '../certificates/A4LandscapeCertificateModal';
import PublicCertificateVerify from '../certificates/PublicCertificateVerify';

export default function StudentPortal() {
  const { currentUser, logout } = useAuth();
  const [db, setDb] = useState(loadDB());
  const [activeTab, setActiveTab] = useState(0);

  // Job Application Modal
  const [selectedJob, setSelectedJob] = useState(null);
  const [coverNote, setCoverNote] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);

  // Certificate Modals
  const [openCertModal, setOpenCertModal] = useState(false);
  const [openVerifyModal, setOpenVerifyModal] = useState(false);

  // Identify Student
  const student = useMemo(() => {
    const list = db.students || [];
    if (currentUser?.studentId) {
      return list.find((s) => s.id === currentUser.studentId) || list[0];
    }
    return list[0];
  }, [db.students, currentUser]);

  const group = useMemo(() => {
    return (db.trainingGroups || []).find((g) => g.id === student?.groupId);
  }, [db.trainingGroups, student]);

  const course = useMemo(() => {
    return (db.courses || []).find((c) => c.id === group?.courseId);
  }, [db.courses, group]);

  const occupation = useMemo(() => {
    return (db.occupations || []).find((o) => o.id === course?.occupationId);
  }, [db.occupations, course]);

  const trainer = useMemo(() => {
    return (db.trainers || []).find((t) => t.id === group?.trainerId);
  }, [db.trainers, group]);

  // Attendance metrics
  const attendanceStats = useMemo(() => {
    if (!student?.id || !group?.id) return { total: 0, present: 0, absent: 0, late: 0, percent: 100 };
    const records = (db.attendances || []).filter(
      (a) => a.studentId === student.id && a.groupId === group.id
    );
    const total = records.length;
    const present = records.filter((a) => a.status === 'present').length;
    const absent = records.filter((a) => a.status === 'absent').length;
    const late = records.filter((a) => a.status === 'late').length;
    const percent = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 100;
    return { total, present, absent, late, percent, records };
  }, [db.attendances, student, group]);

  // Syllabus and evaluations
  const syllabusEvaluations = useMemo(() => {
    if (!course?.id) return [];
    const syllabi = (db.syllabi || []).filter((s) => s.courseId === course.id);
    const evals = (db.evaluations || []).filter((e) => e.studentId === student?.id);

    return syllabi.map((syl) => {
      const match = evals.find((e) => e.syllabusId === syl.id);
      return {
        ...syl,
        evaluation: match || null,
        mastered: match ? Boolean(match.mastered) : false
      };
    });
  }, [db.syllabi, db.evaluations, course, student]);

  const masteredCount = syllabusEvaluations.filter((s) => s.mastered).length;
  const progressPercent = syllabusEvaluations.length > 0
    ? Math.round((masteredCount / syllabusEvaluations.length) * 100)
    : 0;

  // Student Certificate
  const certificate = useMemo(() => {
    return (db.certificates || []).find((c) => c.studentId === student?.id);
  }, [db.certificates, student]);

  // Job Openings & Student's Applications
  const jobOpenings = db.jobOpenings || [];
  const studentApplications = (db.jobApplications || []).filter((a) => a.studentId === student?.id);

  const handleApplyJob = () => {
    if (!selectedJob) return;

    const newApp = {
      id: `APP-${Date.now()}`,
      jobId: selectedJob.id,
      studentId: student.id,
      status: 'Applied',
      applyDate: new Date().toISOString().slice(0, 10),
      coverNote: coverNote.trim(),
      isCurrentlyTraining: student.status === 'Active' || group?.status === 'Running'
    };

    const nextDb = {
      ...db,
      jobApplications: [newApp, ...(db.jobApplications || [])]
    };
    saveDB(nextDb);
    setDb(nextDb);
    setApplySuccess(true);
    setTimeout(() => {
      setApplySuccess(false);
      setSelectedJob(null);
      setCoverNote('');
    }, 1500);
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* Student Banner */}
      <Card
        sx={{
          p: { xs: 2.5, md: 3.5 },
          mb: 3,
          background: 'linear-gradient(135deg, #152238 0%, #1a56b0 100%)',
          color: '#ffffff',
          borderRadius: 3,
          boxShadow: '0 8px 30px rgba(26,86,176,0.2)'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar
              src={student?.photoUrl}
              sx={{
                width: { xs: 72, md: 90 },
                height: { xs: 72, md: 90 },
                border: '3px solid rgba(255,255,255,0.85)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                fontSize: '2rem',
                bgcolor: '#0d9488'
              }}
            >
              {student?.name?.[0] || 'S'}
            </Avatar>
          </Grid>
          <Grid item xs={12} sm>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff' }}>
                {student?.name}
              </Typography>
              <Chip
                label={`TGID: ${student?.tgid || 'GETS-STD'}`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: 700 }}
              />
              <Chip
                label={student?.status || 'Active'}
                size="small"
                sx={{
                  bgcolor: student?.status === 'Active' ? '#10b981' : '#f59e0b',
                  color: '#ffffff',
                  fontWeight: 800
                }}
              />
            </Box>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
              {course?.title || 'Vocational Training'} • {occupation?.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
              Batch: <b>{group?.groupCode} (Shift {group?.shift})</b> | Trainer: <b>{trainer?.name || 'Assigned Instructor'}</b> | Contact: <b>{student?.phone}</b>
            </Typography>
          </Grid>

          <Grid item xs={12} md="auto">
            <Stack direction={{ xs: 'row', md: 'column' }} spacing={1}>
              {certificate && (
                <Button
                  variant="contained"
                  startIcon={<WorkspacePremiumIcon />}
                  onClick={() => setOpenCertModal(true)}
                  sx={{
                    bgcolor: '#f59e0b',
                    color: '#152238',
                    fontWeight: 800,
                    '&:hover': { bgcolor: '#d97706' }
                  }}
                >
                  प्रमाणपत्र हेर्नुहोस्
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<QrCode2Icon />}
                onClick={() => setOpenVerifyModal(true)}
                sx={{
                  color: '#ffffff',
                  borderColor: 'rgba(255,255,255,0.5)',
                  fontWeight: 700,
                  '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                QR Verify
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<LogoutIcon />}
                onClick={() => {
                  if (window.confirm('के तपाईं विद्यार्थी पोर्टलबाट बाहिरिन (Logout) चाहनुहुन्छ?')) {
                    logout();
                  }
                }}
                sx={{
                  color: '#ffffff',
                  borderColor: 'rgba(255,255,255,0.4)',
                  fontWeight: 800,
                  '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)', borderColor: '#EF4444' }
                }}
              >
                Logout
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            '& .MuiTab-root': { fontWeight: 800, fontSize: '0.95rem', textTransform: 'none' }
          }}
        >
          <Tab icon={<FactCheckIcon />} iconPosition="start" label="उपस्थिति (Attendance)" />
          <Tab icon={<SchoolIcon />} iconPosition="start" label="पाठ्यक्रम र सीप मूल्याङ्कन (Syllabus & Competency)" />
          <Tab
            icon={
              <Badge badgeContent={jobOpenings.length} color="error">
                <WorkIcon />
              </Badge>
            }
            iconPosition="start"
            label="रोजगार अवसरहरू (Job Openings & Apply)"
          />
          <Tab icon={<WorkspacePremiumIcon />} iconPosition="start" label="प्रमाणपत्र (Certificate)" />
        </Tabs>
      </Box>

      {/* Tab 0: Attendance Summary */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, textAlign: 'center', height: '100%', borderRadius: 3 }}>
              <Typography variant="overline" sx={{ color: '#647089', fontWeight: 800 }}>
                HAJIRI PERCENTAGE
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 900,
                  color: attendanceStats.percent >= 85 ? '#16834b' : attendanceStats.percent >= 70 ? '#c9820a' : '#d5372f',
                  my: 1
                }}
              >
                {attendanceStats.percent}%
              </Typography>
              <Chip
                label={
                  attendanceStats.percent >= 85
                    ? 'CTEVT Compliant (Regular)'
                    : attendanceStats.percent >= 70
                    ? 'Monitor (Attendance Below 85%)'
                    : 'At Risk (Below 70%)'
                }
                sx={{
                  fontWeight: 800,
                  bgcolor: attendanceStats.percent >= 85 ? '#e5f8ee' : '#fdf3e2',
                  color: attendanceStats.percent >= 85 ? '#16834b' : '#c9820a'
                }}
              />
              <LinearProgress
                variant="determinate"
                value={attendanceStats.percent}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  mt: 3,
                  bgcolor: '#e2e8f0',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: attendanceStats.percent >= 85 ? '#16834b' : attendanceStats.percent >= 70 ? '#c9820a' : '#d5372f'
                  }
                }}
              />
              <Typography variant="caption" sx={{ color: '#647089', display: 'block', mt: 1 }}>
                न्यूनतम ८०% उपस्थिति प्रमाणपत्रको लागि अनिवार्य मानिन्छ।
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                उपस्थिति विवरण (Session Record Breakdown)
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={4}>
                  <Box sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 2, textAlign: 'center', border: '1px solid #bbf7d0' }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#16834b' }}>
                      {attendanceStats.present}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#16834b' }}>
                      उपस्थित (Present)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ p: 2, bgcolor: '#fef2f2', borderRadius: 2, textAlign: 'center', border: '1px solid #fecaca' }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#dc2626' }}>
                      {attendanceStats.absent}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#dc2626' }}>
                      अनुपस्थित (Absent)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ p: 2, bgcolor: '#fffbeb', borderRadius: 2, textAlign: 'center', border: '1px solid #fef3c7' }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#d97706' }}>
                      {attendanceStats.late}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#d97706' }}>
                      ढिला (Late)
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                हालसालैका हाजिरी लगहरू (Recent Attendance Logs)
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 240, borderRadius: 2, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead
                    sx={{
                      bgcolor: '#0F2E5A',
                      '& .MuiTableCell-head': {
                        bgcolor: '#0F2E5A !important',
                        color: '#FFFFFF !important',
                        fontWeight: 900,
                        fontSize: '0.82rem',
                        py: 1.2,
                        borderBottom: '2px solid #F59E0B'
                      }
                    }}
                  >
                    <TableRow>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 55, textAlign: 'center' }}>क्र.सं.</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>मिति (Date)</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>स्थिति (Status)</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>कैफियत (Remarks)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(attendanceStats.records || []).slice(-10).reverse().map((r, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: '#64748B' }}>{i + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{r.date}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={r.status.toUpperCase()}
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              bgcolor: r.status === 'present' ? '#e5f8ee' : r.status === 'absent' ? '#fee2e2' : '#fef3c7',
                              color: r.status === 'present' ? '#16834b' : r.status === 'absent' ? '#dc2626' : '#d97706'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#647089' }}>{r.remarks || '—'}</TableCell>
                      </TableRow>
                    ))}
                    {(attendanceStats.records || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 3, color: '#647089' }}>
                          कुनै हाजिरी रेकर्ड फेला परेन।
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab 1: Syllabus Competency */}
      {activeTab === 1 && (
        <Card sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {course?.title} - पाठ्यक्रम तथा सीप स्थिति
              </Typography>
              <Typography variant="body2" sx={{ color: '#647089' }}>
                प्रशिक्षकले प्रमाणित गरेको तपाईंको व्यावहारिक तथा सैद्धान्तिक क्षमता प्रगति विवरण।
              </Typography>
            </Box>
            <Chip
              icon={<CheckCircleIcon />}
              label={`${masteredCount} / ${syllabusEvaluations.length} Units Mastered (${progressPercent}%)`}
              color="success"
              sx={{ fontWeight: 800 }}
            />
          </Box>

          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{ height: 8, borderRadius: 4, mb: 3 }}
          />

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table>
              <TableHead
                sx={{
                  bgcolor: '#0F2E5A',
                  '& .MuiTableCell-head': {
                    bgcolor: '#0F2E5A !important',
                    color: '#FFFFFF !important',
                    fontWeight: 900,
                    fontSize: '0.84rem',
                    py: 1.5,
                    borderBottom: '2px solid #F59E0B'
                  }
                }}
              >
                <TableRow>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 70 }}>एकाइ</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>शीर्षक तथा सिकाइ उपलब्धि</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 120 }}>घण्टा भार</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 140 }}>स्थिति</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>सुधार गर्नुपर्ने पक्ष / योजना</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {syllabusEvaluations.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ fontWeight: 800, color: '#1a56b0' }}>
                      Unit {item.unitNo}
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {item.title}
                      </Typography>
                      {item.learningOutcome && (
                        <Typography variant="caption" sx={{ color: '#647089', display: 'block' }}>
                          🎯 {item.learningOutcome}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        T: {item.theoryHours}h | P: {item.practicalHours}h ({item.totalHours}h)
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {item.mastered ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Mastered"
                          size="small"
                          sx={{ bgcolor: '#e5f8ee', color: '#16834b', fontWeight: 800 }}
                        />
                      ) : (
                        <Chip
                          icon={<AccessTimeIcon />}
                          label="In Progress"
                          size="small"
                          sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 700 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {item.evaluation?.areasToImprove ? (
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#dc2626' }}>
                            सुधार: {item.evaluation.areasToImprove}
                          </Typography>
                          {item.evaluation.trainerPlan && (
                            <Typography variant="caption" sx={{ display: 'block', color: '#1a56b0' }}>
                              ट्रेनर योजना: {item.evaluation.trainerPlan}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          संतोषजनक प्रगति
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab 2: Job Board & Applications */}
      {activeTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                रोजगार तथा OJT अवसरहरू (Job & OJT Opportunities)
              </Typography>
              <Typography variant="body2" sx={{ color: '#647089' }}>
                तालिम चलिरहेको अवस्थामा पनि रोजगारदाता कम्पनीमा सिधै आवेदन दिन सक्नुहुन्छ।
              </Typography>
            </Box>
            <Chip
              label={`आवेदन गरिएका: ${studentApplications.length}`}
              color="primary"
              sx={{ fontWeight: 800 }}
            />
          </Box>

          {/* Applied Jobs Section if any */}
          {studentApplications.length > 0 && (
            <Card sx={{ p: 2.5, mb: 3, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#16834b', mb: 1.5 }}>
                तपाईंका सक्रिय रोजगार आवेदनहरू (Your Active Applications)
              </Typography>
              <Grid container spacing={2}>
                {studentApplications.map((app) => {
                  const job = jobOpenings.find((j) => j.id === app.jobId);
                  const emp = (db.employers || []).find((e) => e.id === job?.employerId);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={app.id}>
                      <Card sx={{ p: 2, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                          {job?.title || 'Job Opening'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#647089', display: 'block' }}>
                          🏢 {emp?.name || 'Partner Company'}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            Applied: {app.applyDate}
                          </Typography>
                          <Chip
                            size="small"
                            label={app.status}
                            sx={{
                              fontWeight: 800,
                              bgcolor: app.status === 'Hired' ? '#10b981' : app.status === 'Shortlisted' ? '#0284c7' : '#f59e0b',
                              color: '#fff'
                            }}
                          />
                        </Box>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Card>
          )}

          {/* Available Jobs Grid */}
          <Grid container spacing={2.5}>
            {jobOpenings.map((job) => {
              const emp = (db.employers || []).find((e) => e.id === job.employerId);
              const occ = (db.occupations || []).find((o) => o.id === job.occupationId);
              const hasApplied = studentApplications.some((a) => a.jobId === job.id);

              return (
                <Grid item xs={12} md={6} key={job.id}>
                  <Card
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#152238' }}>
                            {job.title}
                          </Typography>
                          <Typography variant="subtitle2" sx={{ color: '#1a56b0', fontWeight: 700 }}>
                            {emp?.name || 'Approved Employer'}
                          </Typography>
                        </Box>
                        <Chip
                          label={job.employmentType || 'Full-Time'}
                          size="small"
                          sx={{ bgcolor: '#e8f0fd', color: '#1a56b0', fontWeight: 700 }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, my: 1.5 }}>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#647089' }}>
                          <LocationOnIcon sx={{ fontSize: 16 }} /> {job.location || 'Kathmandu'}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#16834b', fontWeight: 700 }}>
                          💰 {job.salaryRange || 'Attractive Salary'}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#647089' }}>
                          👥 {job.vacancies || 1} सिट खुला
                        </Typography>
                      </Box>

                      <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
                        {job.description}
                      </Typography>

                      {job.requiredSkills && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#152238', display: 'block', mb: 0.5 }}>
                            आवश्यक सीपहरू (Key Competencies):
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#647089', bgcolor: '#f8fafc', p: 1, borderRadius: 1.5, display: 'block' }}>
                            {job.requiredSkills}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        Occupation: {occ?.name || 'General'}
                      </Typography>
                      {hasApplied ? (
                        <Button variant="outlined" disabled size="small" sx={{ fontWeight: 700 }}>
                          ✓ पहिले नै आवेदन गरिएको
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<SendIcon />}
                          onClick={() => setSelectedJob(job)}
                          sx={{ fontWeight: 800, bgcolor: '#1a56b0' }}
                        >
                          आवेदन दिनुहोस् (Apply Now)
                        </Button>
                      )}
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* Tab 3: Official Certificate */}
      {activeTab === 3 && (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          {certificate ? (
            <Box sx={{ maxWidth: 600, mx: 'auto' }}>
              <WorkspacePremiumIcon sx={{ fontSize: 64, color: '#f59e0b', mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#152238' }}>
                बधाई छ! तपाईंको आधिकारिक प्रमाणपत्र जारी भएको छ।
              </Typography>
              <Typography variant="body1" sx={{ color: '#647089', my: 1 }}>
                CTEVT मान्यता प्राप्त राष्ट्रिय मापदण्ड अनुसारको व्यावसायिक तालिम प्रमाणपत्र।
              </Typography>

              <Card sx={{ p: 2.5, my: 3, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', textAlign: 'left' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#647089' }}>Certificate No:</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{certificate.certificateNo}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#647089' }}>Issue Date:</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{certificate.issueDate}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#647089' }}>Grade / Division:</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#16834b' }}>{certificate.grade || 'Distinction'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#647089' }}>Verification Hash:</Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, display: 'block' }}>
                      {certificate.verificationCode || certificate.certificateNo}
                    </Typography>
                  </Grid>
                </Grid>
              </Card>

              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<VisibilityIcon />}
                  onClick={() => setOpenCertModal(true)}
                  sx={{ bgcolor: '#1a56b0', fontWeight: 800 }}
                >
                  प्रमाणपत्र हेर्नुहोस् (A4 Print Ready)
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<QrCode2Icon />}
                  onClick={() => setOpenVerifyModal(true)}
                  sx={{ fontWeight: 700 }}
                >
                  अनलाइन QR प्रमाणित गर्नुहोस्
                </Button>
              </Stack>
            </Box>
          ) : (
            <Box sx={{ py: 6 }}>
              <SchoolIcon sx={{ fontSize: 60, color: '#94a3b8', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#647089' }}>
                प्रमाणपत्र तयारीको क्रममा छ (In Progress)
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5, maxWidth: 500, mx: 'auto' }}>
                तपाईंको तालिम, आवश्यक हाजिरी (न्यूनतम ८०%) र सीप मूल्याङ्कन पूर्ण भएपछि इन्स्टिच्युटबाट आधिकारिक प्रमाणपत्र जारी गरिनेछ।
              </Typography>
            </Box>
          )}
        </Card>
      )}

      {/* Apply Job Dialog */}
      <Dialog open={Boolean(selectedJob)} onClose={() => setSelectedJob(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {selectedJob?.title} को लागि आवेदन
        </DialogTitle>
        <DialogContent>
          {applySuccess && (
            <Alert severity="success" sx={{ mb: 2, fontWeight: 700 }}>
              तपाईंको आवेदन सफलतापूर्वक पठाइयो! रोजगारदातालाई सूचित गरिएको छ।
            </Alert>
          )}
          <Typography variant="body2" sx={{ color: '#647089', mb: 2 }}>
            कम्पनी: <b>{(db.employers || []).find((e) => e.id === selectedJob?.employerId)?.name}</b>
          </Typography>
          <TextField
            label="तपाईंको छोटो अनुभव वा सन्देश (Optional Note to Employer)"
            fullWidth
            multiline
            rows={4}
            value={coverNote}
            onChange={(e) => setCoverNote(e.target.value)}
            placeholder="उदाहरण: मैले ग्लोबल एरामा बेसिक टेलरिङ तालिम ९५% हाजिरीका साथ पूरा गरेको छु। कुर्था तथा ब्लाउज कटिङमा दक्षता छ।"
          />
          <Alert severity="info" sx={{ mt: 2, fontSize: '0.85rem' }}>
            रोजगारदाताले तपाईंको हाजिरी दर ({attendanceStats.percent}%) र मास्टर गरिएका सीपहरू अवलोकन गर्न सक्नेछन्।
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setSelectedJob(null)}>रद्द गर्नुहोस्</Button>
          <Button variant="contained" onClick={handleApplyJob} sx={{ fontWeight: 800 }}>
            आवेदन पठाउनुहोस् (Submit Application)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Certificate Modal */}
      {certificate && (
        <A4LandscapeCertificateModal
          open={openCertModal}
          onClose={() => setOpenCertModal(false)}
          certificate={certificate}
          student={student}
          course={course}
          group={group}
          trainer={trainer}
        />
      )}

      {/* Verify Modal */}
      {certificate && (
        <PublicCertificateVerify
          open={openVerifyModal}
          onClose={() => setOpenVerifyModal(false)}
          certId={certificate.certificateNo}
          certificate={certificate}
          student={student}
          course={course}
          group={group}
          onOpenFullCertificate={() => {
            setOpenVerifyModal(false);
            setOpenCertModal(true);
          }}
        />
      )}
    </Box>
  );
}
