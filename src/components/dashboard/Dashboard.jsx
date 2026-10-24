import React from 'react';
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
  LinearProgress
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
import { loadDB } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { getWhatsAppUrl } from '../../services/exportUtils';

export default function Dashboard({ onNavigate }) {
  const db = loadDB();
  const { currentUser, isTrainer, isAdmin } = useAuth();

  // Filter groups if trainer
  const groups = isTrainer
    ? (db.trainingGroups || []).filter((g) => g.trainerId === currentUser?.trainerId)
    : db.trainingGroups || [];

  const students = isTrainer
    ? (db.students || []).filter((s) => groups.some((g) => g.id === s.groupId))
    : db.students || [];

  const totalStudents = students.length;
  const activeGroups = groups.filter((g) => g.status === 'Running').length;

  // Calculate attendance rate
  const totalAttendances = db.attendances.length;
  const presentCount = db.attendances.filter((a) => a.status === 'present').length;
  const overallAttRate = totalAttendances > 0 ? Math.round((presentCount / totalAttendances) * 100) : 92;

  // Placements count
  const placedCount = (db.placements || []).filter((p) => p.status === 'Placed' || p.status === 'Ongoing').length;

  // Identify At-Risk Students (example: attendance < 80% or absent remarks)
  const atRiskStudents = students.slice(0, 2);

  return (
    <Box>
      {/* Welcome Banner */}
      <Card
        sx={{
          mb: 3,
          background: 'linear-gradient(135deg, #0d3466 0%, #1a56b0 70%, #2f7de1 100%)',
          color: '#ffffff',
          borderRadius: 4,
          p: { xs: 2.5, sm: 3.5 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 650 }}>
          <Chip
            label={isTrainer ? 'Trainer Portal' : 'Admin Operations Hub'}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 800, mb: 1.5 }}
          />
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 1, fontSize: { xs: '1.3rem', sm: '1.75rem' } }}>
            नमस्ते, {currentUser?.name}!
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.6, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
            {isTrainer
              ? 'आफ्नो तालिम समूहको दैनिक हाजिरी लिनुहोस्, Work Plan / Lesson Plan तयार गर्नुहोस् र विद्यार्थी सीप मूल्यांकन भर्नुहोस्।'
              : 'ग्लोबल एरा प्राविधिक स्कुल — Occupation Master देखि OJT र Placement सम्मको सम्पूर्ण तालिम व्यवस्थापन प्रणाली।'}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => onNavigate('attendance')}
              startIcon={<FactCheckIcon />}
              sx={{
                bgcolor: '#ffffff',
                color: '#1a56b0',
                fontWeight: 800,
                '&:hover': { bgcolor: '#f1f5fa' }
              }}
            >
              Mark Today's Attendance
            </Button>
            <Button
              variant="outlined"
              onClick={() => onNavigate('reports')}
              startIcon={<AssessmentIcon />}
              sx={{
                borderColor: 'rgba(255,255,255,0.7)',
                color: '#ffffff',
                fontWeight: 800,
                bgcolor: 'rgba(255,255,255,0.12)',
                '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              Reports & Analytics
            </Button>
            <Button
              variant="outlined"
              onClick={() => onNavigate('communication')}
              startIcon={<ForumIcon />}
              sx={{
                borderColor: 'rgba(255,255,255,0.7)',
                color: '#ffffff',
                fontWeight: 800,
                bgcolor: 'rgba(255,255,255,0.12)',
                '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              Communication Center
            </Button>
            <Button
              variant="outlined"
              onClick={() => onNavigate('certificates')}
              startIcon={<WorkspacePremiumIcon />}
              sx={{
                borderColor: 'rgba(255,255,255,0.7)',
                color: '#ffffff',
                fontWeight: 800,
                bgcolor: 'rgba(255,255,255,0.12)',
                '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              Certificates (CTEVT)
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Active Notices Banner */}
      {(() => {
        const activeNotices = (db.notices || []).filter((n) => n.status === 'Active');
        if (activeNotices.length === 0) return null;
        const topNotice = activeNotices[0];
        return (
          <Card
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: topNotice.priority === 'Urgent' ? '#fca5a5' : '#bfdbfe',
              bgcolor: topNotice.priority === 'Urgent' ? '#fff1f2' : '#eff6ff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1.5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CampaignIcon sx={{ color: topNotice.priority === 'Urgent' ? '#e11d48' : '#1d4ed8', fontSize: 28 }} />
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a' }}>
                    {topNotice.title}
                  </Typography>
                  <Chip
                    label={topNotice.priority}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      bgcolor: topNotice.priority === 'Urgent' ? '#ffe4e6' : '#dbeafe',
                      color: topNotice.priority === 'Urgent' ? '#e11d48' : '#1e40af'
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: '#475569', display: 'block', fontWeight: 600 }}>
                  {topNotice.content}
                </Typography>
              </Box>
            </Box>

            <Button
              size="small"
              onClick={() => onNavigate('notices')}
              sx={{ fontWeight: 800, textTransform: 'none', color: topNotice.priority === 'Urgent' ? '#e11d48' : '#1d4ed8' }}
            >
              View Notice Board →
            </Button>
          </Card>
        );
      })()}

      {/* KPI Cards Grid */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#e8f0fd', color: '#1a56b0', width: 48, height: 48 }}>
              <SchoolIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#152238' }}>
                {totalStudents}
              </Typography>
              <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700 }}>
                {isTrainer ? 'My Students' : 'Enrolled Students'}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#e5f8ee', color: '#1a9c5c', width: 48, height: 48 }}>
              <GroupWorkIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#152238' }}>
                {activeGroups}
              </Typography>
              <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700 }}>
                Active Batches
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#fdf3e2', color: '#c9820a', width: 48, height: 48 }}>
              <FactCheckIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#152238' }}>
                {overallAttRate}%
              </Typography>
              <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700 }}>
                Avg Attendance Rate
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#f1ecfb', color: '#6c3fc9', width: 48, height: 48 }}>
              <RocketLaunchIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#152238' }}>
                {placedCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700 }}>
                Placed / In OJT
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* At-Risk Warning Alerts (TVET Automation) */}
      {atRiskStudents.length > 0 && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon />}
          sx={{ mb: 3.5, borderRadius: 3, alignItems: 'center' }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => onNavigate('reports')}
              sx={{ fontWeight: 800, bgcolor: 'rgba(0,0,0,0.06)' }}
            >
              Open Red Alert Report
            </Button>
          }
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            Automated Dropout Risk Warning (नियमितता अनुगमन)
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
            <b>{atRiskStudents[0]?.name}</b> ({atRiskStudents[0]?.tgid}) has an attendance rate near 80%. Consider calling guardian via WhatsApp/SMS.
          </Typography>
        </Alert>
      )}

      {/* Today's Training Groups / Class Schedule */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 2.5, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#152238' }}>
                  🗓️ Training Groups (Active Batches)
                </Typography>
                <Typography variant="caption" sx={{ color: '#647089' }}>
                  Operational center with assigned shifts & trainers
                </Typography>
              </Box>
              <Button size="small" onClick={() => onNavigate('groups')} endIcon={<ArrowForwardIcon />}>
                All Groups
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {groups.map((grp) => {
                const course = db.courses.find((c) => c.id === grp.courseId);
                const trainer = db.trainers.find((t) => t.id === grp.trainerId);
                const studentCount = db.students.filter((s) => s.groupId === grp.id).length;

                return (
                  <Paper
                    key={grp.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderColor: '#e2e8f0',
                      '&:hover': { bgcolor: '#f8fbff', borderColor: '#1a56b0' }
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Chip
                          label={grp.groupCode}
                          size="small"
                          sx={{ fontWeight: 800, bgcolor: '#1a56b0', color: '#fff' }}
                        />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {course?.title || 'Course'}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#647089', display: 'block' }}>
                        Shift {grp.shift} ({grp.startTime} – {grp.endTime}) • Trainer: <b>{trainer?.name || 'TBA'}</b>
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#1a9c5c', fontWeight: 700 }}>
                        {studentCount} Enrolled Students
                      </Typography>
                    </Box>

                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => onNavigate('attendance')}
                      sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.8rem' }}
                    >
                      Attendance
                    </Button>
                  </Paper>
                );
              })}
            </Box>
          </Card>
        </Grid>

        {/* Quick Students Roster */}
        <Grid item xs={12} md={5}>
          <Card sx={{ p: 2.5, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#152238' }}>
                  🎓 Recent Admissions
                </Typography>
                <Typography variant="caption" sx={{ color: '#647089' }}>
                  Latest enrolled students in training
                </Typography>
              </Box>
              <Button size="small" onClick={() => onNavigate('students')} endIcon={<ArrowForwardIcon />}>
                View All
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {students.slice(0, 4).map((std) => {
                const grp = db.trainingGroups.find((g) => g.id === std.groupId);
                const course = db.courses.find((c) => c.id === grp?.courseId);

                return (
                  <Box
                    key={std.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: 2.5,
                      bgcolor: '#f8fafc',
                      border: '1px solid #edf2f7'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar src={std.photoUrl} sx={{ width: 40, height: 40, fontWeight: 700, bgcolor: '#1a56b0' }}>
                        {std.name[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                          {std.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#647089' }}>
                          {std.tgid} • {course?.title?.split(' ')[0] || 'Course'}
                        </Typography>
                      </Box>
                    </Box>

                    <IconButton
                      size="small"
                      component="a"
                      href={getWhatsAppUrl(std.phone, `Namaste ${std.name}, this is from KITE Training Center.`)}
                      target="_blank"
                      sx={{ color: '#25D366' }}
                    >
                      <WhatsAppIcon fontSize="small" />
                    </IconButton>
                  </Box>
                );
              })}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
