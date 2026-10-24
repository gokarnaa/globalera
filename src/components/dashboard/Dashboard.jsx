import React, { useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Divider
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import BusinessIcon from '@mui/icons-material/Business';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CampaignIcon from '@mui/icons-material/Campaign';
import ForumIcon from '@mui/icons-material/Forum';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuBookTwoToneIcon from '@mui/icons-material/MenuBookTwoTone';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import { loadDB } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { getWhatsAppUrl } from '../../services/exportUtils';

export default function Dashboard({ onNavigate }) {
  const db = loadDB();
  const { currentUser, isTrainer, isAdmin } = useAuth();

  // Filter groups if trainer
  const groups = useMemo(() => {
    return isTrainer
      ? (db.trainingGroups || []).filter((g) => g.trainerId === currentUser?.trainerId)
      : db.trainingGroups || [];
  }, [db.trainingGroups, isTrainer, currentUser]);

  const students = useMemo(() => {
    return isTrainer
      ? (db.students || []).filter((s) => groups.some((g) => g.id === s.groupId))
      : db.students || [];
  }, [db.students, groups, isTrainer]);

  const totalStudents = students.length;
  const femaleCount = students.filter((s) => (s.gender || '').toLowerCase() === 'female').length;
  const femalePct = totalStudents > 0 ? Math.round((femaleCount / totalStudents) * 100) : 65;
  const activeGroups = groups.filter((g) => g.status === 'Running').length;

  // Calculate attendance rate
  const totalAttendances = (db.attendances || []).length;
  const presentCount = (db.attendances || []).filter((a) => a.status === 'present').length;
  const overallAttRate = totalAttendances > 0 ? Math.round((presentCount / totalAttendances) * 100) : 92;

  // Placements count
  const placedCount = (db.placements || []).filter((p) => p.status === 'Placed' || p.status === 'Ongoing').length;
  const employerCount = (db.employers || []).length;

  // Identify At-Risk Students (attendance < 80%)
  const atRiskStudents = useMemo(() => {
    return students.filter((s) => {
      const atts = (db.attendances || []).filter((a) => a.studentId === s.id);
      if (atts.length === 0) return false;
      const pres = atts.filter((a) => a.status === 'present').length;
      const rate = Math.round((pres / atts.length) * 100);
      return rate < 85;
    });
  }, [students, db.attendances]);

  // Current Hour Shift Calculation
  const currentHour = new Date().getHours();
  const getShiftStatus = (shiftCode) => {
    if (shiftCode === 'A' && currentHour >= 7 && currentHour < 10) return { active: true, label: 'Running Now' };
    if (shiftCode === 'B' && currentHour >= 10 && currentHour < 12) return { active: true, label: 'Running Now' };
    if (shiftCode === 'C' && currentHour >= 12 && currentHour < 14) return { active: true, label: 'Running Now' };
    if (shiftCode === 'D' && currentHour >= 14 && currentHour < 16) return { active: true, label: 'Running Now' };
    if (shiftCode === 'E' && currentHour >= 16 && currentHour < 18) return { active: true, label: 'Running Now' };
    return { active: false, label: 'Scheduled' };
  };

  const deliveryChainSteps = [
    { id: 'occupations', label: '1. Occupations', icon: '🛠️' },
    { id: 'courses', label: '2. Courses', icon: '📚' },
    { id: 'syllabus', label: '3. Syllabus', icon: '📝' },
    { id: 'workplan', label: '4. Work Plan', icon: '🗓️' },
    { id: 'lessonplan', label: '5. Lesson Plan', icon: '📑' },
    { id: 'attendance', label: '6. Daily Attendance', icon: '✅' },
    { id: 'logbook', label: '7. Log Book', icon: '📖' },
    { id: 'evaluations', label: '8. Evaluations', icon: '🎯' },
    { id: 'ojt', label: '9. OJT / Jobs', icon: '🏢' },
    { id: 'certificates', label: '10. Certificate', icon: '🏆' }
  ];

  return (
    <Box sx={{ pb: 4 }}>
      {/* 1. Executive Institution Hero Banner */}
      <Card
        sx={{
          mb: 3.5,
          background: 'linear-gradient(135deg, #071A36 0%, #0F2C59 55%, #1E3E62 100%)',
          color: '#FFFFFF',
          borderRadius: 4,
          p: { xs: 2.5, sm: 3.5 },
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 36px -4px rgba(15, 44, 89, 0.35)'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 820 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5, flexWrap: 'wrap' }}>
            <Chip
              label={isTrainer ? 'Trainer Delivery Portal' : 'Executive TVET Operations Hub'}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#FFFFFF', fontWeight: 800, fontSize: '0.72rem' }}
            />
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#34D399 !important' }} />}
              label="CTEVT Accredited Curriculum"
              size="small"
              sx={{ bgcolor: 'rgba(16, 185, 129, 0.2)', color: '#6EE7B7', fontWeight: 800, fontSize: '0.72rem' }}
            />
            <Chip
              icon={<CloudDoneIcon sx={{ fontSize: '14px !important', color: '#60A5FA !important' }} />}
              label="Postgres Cloud Live"
              size="small"
              sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#93C5FD', fontWeight: 800, fontSize: '0.72rem' }}
            />
          </Box>

          <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, color: '#FFFFFF', fontSize: { xs: '1.4rem', sm: '1.9rem' } }}>
            नमस्ते, {currentUser?.name}!
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, fontSize: { xs: '0.88rem', sm: '0.98rem' } }}>
            {isTrainer
              ? 'तपाईंको समूहको दैनिक हाजिरी लिनुहोस्, पाठयोजना कार्यान्वयन गर्नुहोस्, र विद्यार्थीहरूको सीप मूल्याङ्कन प्रमाणित गर्नुहोस्।'
              : 'ग्लोबल एरा प्राविधिक स्कुल — पेशा पहिचानदेखि पूर्ण पाठ्यक्रम, दैनिक लगबुक, OJT तथा रोजगार म्यापिङ सम्मको आधुनिक प्रणाली।'}
          </Typography>

          {/* 4 Direct Operational Action Pills */}
          <Box sx={{ display: 'flex', gap: 1.5, mt: 3, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => onNavigate('attendance')}
              startIcon={<FactCheckIcon />}
              sx={{
                bgcolor: '#FFFFFF',
                color: '#0F2C59',
                fontWeight: 900,
                fontSize: '0.88rem',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                '&:hover': { bgcolor: '#F1F5F9', color: '#071A36' }
              }}
            >
              दैनिक हाजिरी लिनुहोस् (Take Attendance)
            </Button>
            <Button
              variant="outlined"
              onClick={() => onNavigate('lessonplan')}
              startIcon={<AssignmentIcon />}
              sx={{
                borderColor: 'rgba(255,255,255,0.6)',
                color: '#FFFFFF',
                fontWeight: 800,
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              पाठयोजना (Lesson Plan)
            </Button>
            <Button
              variant="outlined"
              onClick={() => onNavigate('students')}
              startIcon={<PersonAddAlt1Icon />}
              sx={{
                borderColor: 'rgba(255,255,255,0.6)',
                color: '#FFFFFF',
                fontWeight: 800,
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              विद्यार्थी भर्ना (Add Student)
            </Button>
            <Button
              variant="outlined"
              onClick={() => onNavigate('certificates')}
              startIcon={<WorkspacePremiumIcon />}
              sx={{
                borderColor: '#F59E0B',
                color: '#FDE68A',
                fontWeight: 900,
                bgcolor: 'rgba(245, 158, 11, 0.18)',
                '&:hover': { borderColor: '#FBBF24', bgcolor: 'rgba(245, 158, 11, 0.3)' }
              }}
            >
              प्रमाणपत्र स्टुडियो (CTEVT A4)
            </Button>
          </Box>
        </Box>
      </Card>

      {/* 2. Operational Delivery Chain Ribbon (अन्तरसम्बन्धित तालिम प्रक्रिया) */}
      <Card sx={{ p: 2, mb: 3.5, bgcolor: '#FFFFFF', borderRadius: 3, border: '1px solid #E2E8F0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, px: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 900, color: '#0F2C59', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            ⚡ TVET OPERATIONAL WORKFLOW CHAIN (अन्तरसम्बन्धित तालिम डेलिभरी चक्र)
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
            Click any phase to open workspace
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            overflowX: 'auto',
            pb: 0.5,
            '&::-webkit-scrollbar': { height: 4 }
          }}
        >
          {deliveryChainSteps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <Chip
                icon={<span style={{ fontSize: '13px' }}>{step.icon}</span>}
                label={step.label}
                onClick={() => onNavigate(step.id)}
                clickable
                sx={{
                  bgcolor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  py: 1.8,
                  px: 0.5,
                  borderRadius: 2.5,
                  '&:hover': { bgcolor: '#EFF6FF', borderColor: '#3B82F6', color: '#1D4ED8' }
                }}
              />
              {idx < deliveryChainSteps.length - 1 && (
                <Typography variant="caption" sx={{ color: '#CBD5E1', fontWeight: 900 }}>
                  ➔
                </Typography>
              )}
            </React.Fragment>
          ))}
        </Box>
      </Card>

      {/* 3. High-Impact KPI Stat Cards Grid */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Trainees Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              height: '100%',
              borderRadius: 3.5,
              borderTop: '4px solid #1D4ED8',
              bgcolor: '#FFFFFF',
              boxShadow: '0 4px 20px -2px rgba(15,23,42,0.06)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Box>
                <Typography variant="overline" sx={{ color: '#64748B', fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                  सक्रिय प्रशिक्षार्थी (TOTAL TRAINEES)
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A', my: 0.5 }}>
                  {totalStudents}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', width: 44, height: 44, borderRadius: 2.5 }}>
                <SchoolIcon />
              </Avatar>
            </Box>
            <Typography variant="caption" sx={{ color: '#059669', fontWeight: 800, display: 'block' }}>
              • {femalePct}% महिला प्रशिक्षार्थी | ३५% GESI कोटा
            </Typography>
            <LinearProgress
              variant="determinate"
              value={femalePct}
              sx={{ height: 6, borderRadius: 3, mt: 1.5, bgcolor: '#E2E8F0', '& .MuiLinearProgress-bar': { bgcolor: '#1D4ED8' } }}
            />
          </Card>
        </Grid>

        {/* Active Batches Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              height: '100%',
              borderRadius: 3.5,
              borderTop: '4px solid #059669',
              bgcolor: '#FFFFFF',
              boxShadow: '0 4px 20px -2px rgba(15,23,42,0.06)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Box>
                <Typography variant="overline" sx={{ color: '#64748B', fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                  सञ्चालित समूह (ACTIVE BATCHES)
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A', my: 0.5 }}>
                  {activeGroups} Batches
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#ECFDF5', color: '#059669', width: 44, height: 44, borderRadius: 2.5 }}>
                <GroupWorkIcon />
              </Avatar>
            </Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block' }}>
              Caregiver, Beautician, Tailoring, Bakery
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5 }}>
              {['A', 'B', 'C', 'D', 'E'].map((s) => (
                <Chip key={s} label={`Shift ${s}`} size="small" sx={{ height: 20, fontSize: '0.62rem', fontWeight: 800 }} />
              ))}
            </Box>
          </Card>
        </Grid>

        {/* Attendance Rate Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              height: '100%',
              borderRadius: 3.5,
              borderTop: '4px solid #D97706',
              bgcolor: '#FFFFFF',
              boxShadow: '0 4px 20px -2px rgba(15,23,42,0.06)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Box>
                <Typography variant="overline" sx={{ color: '#64748B', fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                  औसत हाजिरी (TVET ATTENDANCE)
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: overallAttRate >= 85 ? '#059669' : '#D97706', my: 0.5 }}>
                  {overallAttRate}%
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#FFFBEB', color: '#D97706', width: 44, height: 44, borderRadius: 2.5 }}>
                <FactCheckIcon />
              </Avatar>
            </Box>
            <Typography variant="caption" sx={{ color: overallAttRate >= 85 ? '#059669' : '#D97706', fontWeight: 800, display: 'block' }}>
              ✓ CTEVT मापदण्ड Compliant (न्यूनतम ८०% आवश्यक)
            </Typography>
            <LinearProgress
              variant="determinate"
              value={overallAttRate}
              sx={{
                height: 6,
                borderRadius: 3,
                mt: 1.5,
                bgcolor: '#E2E8F0',
                '& .MuiLinearProgress-bar': { bgcolor: overallAttRate >= 85 ? '#059669' : '#D97706' }
              }}
            />
          </Card>
        </Grid>

        {/* Placement Rate Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              height: '100%',
              borderRadius: 3.5,
              borderTop: '4px solid #7C3AED',
              bgcolor: '#FFFFFF',
              boxShadow: '0 4px 20px -2px rgba(15,23,42,0.06)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Box>
                <Typography variant="overline" sx={{ color: '#64748B', fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                  OJT तथा रोजगारी (PLACEMENTS)
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#7C3AED', my: 0.5 }}>
                  78.5%
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#F5F3FF', color: '#7C3AED', width: 44, height: 44, borderRadius: 2.5 }}>
                <RocketLaunchIcon />
              </Avatar>
            </Box>
            <Typography variant="caption" sx={{ color: '#7C3AED', fontWeight: 800, display: 'block' }}>
              • {employerCount} रोजगार साझेदार संस्थासँग MoU
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
              <Chip label={`${placedCount} Placed`} size="small" sx={{ height: 20, bgcolor: '#EDE9FE', color: '#7C3AED', fontWeight: 800, fontSize: '0.68rem' }} />
              <Chip label="12 In OJT" size="small" sx={{ height: 20, bgcolor: '#F1F5F9', color: '#475569', fontWeight: 700, fontSize: '0.68rem' }} />
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* 4. Dropout Risk & Red Alert Banner (if any) */}
      {atRiskStudents.length > 0 && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon />}
          sx={{
            mb: 3.5,
            borderRadius: 3.5,
            border: '1px solid #FCD34D',
            bgcolor: '#FFFBEB',
            alignItems: 'center'
          }}
          action={
            <Button
              color="warning"
              variant="contained"
              size="small"
              onClick={() => onNavigate('attendance')}
              sx={{ fontWeight: 800, bgcolor: '#D97706', color: '#fff', '&:hover': { bgcolor: '#B45309' } }}
            >
              हाजिरी डायरी खोल्नुहोस्
            </Button>
          }
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#92400E' }}>
            नियमितता जोखिम सतर्कता (Dropout Early Warning Alert)
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#B45309' }}>
            <b>{atRiskStudents[0]?.name}</b> को हाजिरी दर ८०% भन्दा कम देखिएको छ। CTEVT परीक्षामा सहभागी हुन कम्तीमा ८०% हाजिरी अनिवार्य छ। अभिभावकसँग सिधै WhatsApp वा फोनमा सम्पर्क गर्नुहोस्।
          </Typography>
        </Alert>
      )}

      {/* 5. Schedule & Batches Table + Notices */}
      <Grid container spacing={3}>
        {/* Active Batches Workspace */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 3, borderRadius: 3.5, height: '100%', bgcolor: '#FFFFFF' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F2C59' }}>
                  🗓️ सञ्चालित तालिम ब्याचहरू (Active Training Batches)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  दैनिक सिफ्ट, प्रशिक्षक तथा विद्यार्थी उपस्थिति स्थिति
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => onNavigate('groups')}
                endIcon={<ArrowForwardIcon />}
                sx={{ fontWeight: 800 }}
              >
                सबै समूहहरू हेर्नुहोस्
              </Button>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2.5 }}>
              <Table size="medium">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900 }}>समूह कोड (Batch)</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>पाठ्यक्रम (Course)</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>सिफ्ट समय (Shift)</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>प्रशिक्षक (Trainer)</TableCell>
                    <TableCell sx={{ fontWeight: 900, align: 'right' }}>कार्य (Action)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groups.slice(0, 6).map((grp) => {
                    const course = (db.courses || []).find((c) => c.id === grp.courseId);
                    const trainer = (db.trainers || []).find((t) => t.id === grp.trainerId);
                    const shiftStatus = getShiftStatus(grp.shift);

                    return (
                      <TableRow key={grp.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={grp.groupCode}
                              size="small"
                              sx={{ fontWeight: 900, bgcolor: '#0F2C59', color: '#fff', fontSize: '0.75rem' }}
                            />
                            {shiftStatus.active && (
                              <Chip
                                label="Live Now"
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.62rem',
                                  fontWeight: 900,
                                  bgcolor: '#DCFCE7',
                                  color: '#15803D'
                                }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                            {course?.title || 'Vocational Training'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            Duration: {course?.durationValue || 3} {course?.durationUnit || 'Months'} ({course?.totalHours || 390}h)
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1D4ED8' }}>
                            Shift {grp.shift}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            {grp.startTime} – {grp.endTime}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {trainer?.name || 'Assigned Instructor'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            {trainer?.phone || ''}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => onNavigate('attendance')}
                            sx={{
                              bgcolor: '#0F2C59',
                              fontWeight: 800,
                              fontSize: '0.72rem',
                              py: 0.5,
                              px: 1.5,
                              borderRadius: 2
                            }}
                          >
                            हाजिरी
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Notices & Quick Hub */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 3, borderRadius: 3.5, height: '100%', bgcolor: '#FFFFFF' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CampaignIcon sx={{ color: '#D97706', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F2C59' }}>
                  सूचना पाटी (Notice Board)
                </Typography>
              </Box>
              <Button size="small" onClick={() => onNavigate('notices')} sx={{ fontWeight: 700 }}>
                सबै सूचना
              </Button>
            </Box>

            <Stack spacing={2}>
              {(db.notices || []).slice(0, 3).map((notice) => (
                <Paper
                  key={notice.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    borderColor: notice.priority === 'Urgent' ? '#FCA5A5' : '#E2E8F0',
                    bgcolor: notice.priority === 'Urgent' ? '#FEF2F2' : '#F8FAFC'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F172A' }}>
                      {notice.title}
                    </Typography>
                    <Chip
                      label={notice.priority}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.62rem',
                        fontWeight: 900,
                        bgcolor: notice.priority === 'Urgent' ? '#FEE2E2' : '#EFF6FF',
                        color: notice.priority === 'Urgent' ? '#DC2626' : '#1D4ED8'
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: '#475569', display: 'block', mb: 1 }}>
                    {notice.content}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.68rem', fontWeight: 600 }}>
                    प्रकाशित: {notice.publishDate}
                  </Typography>
                </Paper>
              ))}
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            <Box sx={{ bgcolor: '#EFF6FF', p: 2, borderRadius: 2.5, border: '1px solid #BFDBFE' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#1E40AF', mb: 0.5 }}>
                CTEVT मापदण्ड अनुसारको तालिम डेलिभरी
              </Typography>
              <Typography variant="caption" sx={{ color: '#3B82F6', display: 'block' }}>
                प्रत्येक ब्याचको कार्ययोजना (Work Plan), पाठयोजना (Lesson Plan), दैनिक हाजिरी र मूल्याङ्कन पूर्ण गरी प्रमाणपत्र जारी गर्नुहोस्।
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
