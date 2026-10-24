import React, { useState, useMemo } from 'react';
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
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Stack,
  Grid,
  InputAdornment,
  LinearProgress,
  Tooltip,
  Divider,
  Avatar,
  Badge,
  Alert
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WorkIcon from '@mui/icons-material/Work';
import SearchIcon from '@mui/icons-material/Search';
import PrintIcon from '@mui/icons-material/Print';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import BusinessIcon from '@mui/icons-material/Business';
import { loadDB, saveDB } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { getWhatsAppUrl } from '../../services/exportUtils';
import OfficialDocumentModal from '../common/OfficialDocumentModal';

export default function ReportsManager() {
  const [db, setDb] = useState(loadDB());
  const { currentUser, isTrainer } = useAuth();

  const myGroups = isTrainer
    ? db.trainingGroups.filter((g) => g.trainerId === currentUser?.trainerId)
    : db.trainingGroups;

  // Active Tab State (0: Attendance, 1: Dropout Red Alert, 2: Syllabus Progress, 3: NSTB Competency, 4: OJT/Placement)
  const [activeTab, setActiveTab] = useState(0);

  // Common Filters
  const [selectedGroupId, setSelectedGroupId] = useState(myGroups[0]?.id || db.trainingGroups[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('2026-10'); // YYYY-MM

  // Official Modal State
  const [officialModalOpen, setOfficialModalOpen] = useState(false);
  const [reportDocType, setReportDocType] = useState('ATTENDANCE'); // ATTENDANCE | DROPOUT | SYLLABUS | NSTB | PLACEMENT

  const selectedGroup = db.trainingGroups.find((g) => g.id === selectedGroupId);
  const selectedCourse = db.courses.find((c) => c.id === selectedGroup?.courseId);
  const trainer = db.trainers.find((t) => t.id === selectedGroup?.trainerId) || { name: 'Assigned Instructor', phone: '' };
  const groupStudents = (db.students || []).filter((s) => s.groupId === selectedGroupId);
  const availableSyllabi = (db.syllabi || []).filter((s) => s.courseId === selectedCourse?.id);

  // ----------------------------------------------------
  // 1. DATA COMPUTATION: MONTHLY ATTENDANCE MATRIX
  // ----------------------------------------------------
  const monthDates = useMemo(() => {
    // Generate dates for selected month that have attendance in db or standard 30 days
    const groupAtts = (db.attendances || []).filter(
      (a) => a.groupId === selectedGroupId && a.date.startsWith(selectedMonth)
    );
    const uniqueDates = Array.from(new Set(groupAtts.map((a) => a.date))).sort();
    if (uniqueDates.length > 0) return uniqueDates;

    // Fallback: generate first 15 days of the month for preview
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const fallbackList = [];
    for (let d = 1; d <= Math.min(daysInMonth, 15); d++) {
      fallbackList.push(`${selectedMonth}-${String(d).padStart(2, '0')}`);
    }
    return fallbackList;
  }, [selectedGroupId, selectedMonth, db.attendances]);

  const studentAttendanceMatrix = useMemo(() => {
    return groupStudents.map((student) => {
      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;
      const dayRecords = {};

      monthDates.forEach((dateStr) => {
        const att = (db.attendances || []).find(
          (a) => a.groupId === selectedGroupId && a.studentId === student.id && a.date === dateStr
        );
        let code = '—';
        if (att) {
          if (att.status === 'present' || att.status === 'P') {
            code = 'P';
            presentCount++;
          } else if (att.status === 'absent' || att.status === 'A') {
            code = 'A';
            absentCount++;
          } else if (att.status === 'late' || att.status === 'L') {
            code = 'L';
            lateCount++;
          }
        }
        dayRecords[dateStr] = code;
      });

      const totalRecordedDays = presentCount + absentCount + lateCount;
      const effectivePresent = presentCount + lateCount * 0.5;
      const attendancePercent =
        totalRecordedDays > 0 ? Math.round((effectivePresent / totalRecordedDays) * 100) : 100;

      return {
        student,
        dayRecords,
        presentCount,
        absentCount,
        lateCount,
        totalRecordedDays,
        attendancePercent
      };
    });
  }, [groupStudents, monthDates, selectedGroupId, db.attendances]);

  // ----------------------------------------------------
  // 2. DATA COMPUTATION: DROPOUT AT-RISK RED ALERT
  // ----------------------------------------------------
  const atRiskStudents = useMemo(() => {
    return studentAttendanceMatrix
      .map((entry) => {
        const { student, attendancePercent, absentCount, totalRecordedDays } = entry;
        let riskLevel = 'LOW'; // LOW | MODERATE | HIGH | CRITICAL
        let reasons = [];

        if (attendancePercent < 70) {
          riskLevel = 'CRITICAL';
          reasons.push(`Attendance rate is critically low (${attendancePercent}%, minimum CTEVT requirement is 80%)`);
        } else if (attendancePercent < 80) {
          riskLevel = 'HIGH';
          reasons.push(`Attendance rate is below CTEVT standard (${attendancePercent}%)`);
        }

        if (absentCount >= 3) {
          if (riskLevel !== 'CRITICAL') riskLevel = 'HIGH';
          reasons.push(`Accumulated ${absentCount} absent days in current period`);
        }

        // Check evaluation progress
        const stdEvaluations = (db.evaluations || []).filter((e) => e.studentId === student.id);
        const masteredEvls = stdEvaluations.filter((e) => e.mastered);
        if (stdEvaluations.length > 0 && masteredEvls.length / stdEvaluations.length < 0.5) {
          reasons.push(`Low practical skill mastery (${masteredEvls.length}/${stdEvaluations.length} tasks passed)`);
          if (riskLevel === 'LOW') riskLevel = 'MODERATE';
        }

        return {
          student,
          attendancePercent,
          absentCount,
          totalRecordedDays,
          riskLevel,
          reasons
        };
      })
      .filter((item) => item.riskLevel !== 'LOW')
      .sort((a, b) => (a.riskLevel === 'CRITICAL' ? -1 : 1));
  }, [studentAttendanceMatrix, db.evaluations]);

  // ----------------------------------------------------
  // 3. DATA COMPUTATION: SYLLABUS & HOURS PROGRESS
  // ----------------------------------------------------
  const syllabusProgressData = useMemo(() => {
    const groupWorkPlans = (db.workPlans || []).filter((wp) => wp.groupId === selectedGroupId);
    const groupLogBooks = (db.logBooks || []).filter((lb) => lb.groupId === selectedGroupId);

    const plannedHours = groupWorkPlans.reduce((sum, wp) => sum + (Number(wp.plannedHours) || 0), 0);
    const deliveredHours = groupLogBooks.reduce((sum, lb) => sum + (Number(lb.actualHours) || 0), 0);
    const totalTargetHours = selectedCourse?.durationHours || 160;

    const unitBreakdown = availableSyllabi.map((syl) => {
      const isPlanned = groupWorkPlans.some((wp) => wp.syllabusId === syl.id);
      const logMatch = groupLogBooks.filter((lb) => {
        const wp = groupWorkPlans.find((w) => w.id === lb.workPlanId);
        return wp?.syllabusId === syl.id || (lb.topicsCovered && lb.topicsCovered.includes(syl.title));
      });
      const hoursDeliveredForUnit = logMatch.reduce((sum, l) => sum + (Number(l.actualHours) || 0), 0);
      const isCompleted = hoursDeliveredForUnit >= syl.totalHours || logMatch.length > 0;

      return {
        unit: syl,
        isPlanned,
        hoursDeliveredForUnit,
        isCompleted
      };
    });

    const completedUnitsCount = unitBreakdown.filter((u) => u.isCompleted).length;

    return {
      plannedHours,
      deliveredHours,
      totalTargetHours,
      progressPercent: Math.min(100, Math.round((deliveredHours / totalTargetHours) * 100)),
      unitBreakdown,
      completedUnitsCount,
      totalUnitsCount: availableSyllabi.length
    };
  }, [selectedGroupId, selectedCourse, availableSyllabi, db.workPlans, db.logBooks]);

  // ----------------------------------------------------
  // 4. DATA COMPUTATION: NSTB COMPETENCY READINESS
  // ----------------------------------------------------
  const nstbReadinessList = useMemo(() => {
    return groupStudents.map((student) => {
      const attEntry = studentAttendanceMatrix.find((m) => m.student.id === student.id);
      const attendancePercent = attEntry?.attendancePercent ?? 100;

      const studentEvls = (db.evaluations || []).filter((e) => e.studentId === student.id);
      const masteredEvls = studentEvls.filter((e) => e.mastered);
      const masteryPercent =
        availableSyllabi.length > 0 ? Math.round((masteredEvls.length / availableSyllabi.length) * 100) : 0;

      // CTEVT Standard: >= 80% Attendance AND >= 75% Skill Competencies
      const isEligible = attendancePercent >= 80 && masteryPercent >= 70;
      let statusText = 'RECOMMENDED FOR NSTB EXAM';
      let statusColor = 'success';

      if (attendancePercent < 80 && masteryPercent < 70) {
        statusText = 'DEFICIENT: LOW ATTENDANCE & SKILL';
        statusColor = 'error';
      } else if (attendancePercent < 80) {
        statusText = 'ATTENDANCE SHORTAGE (<80%)';
        statusColor = 'error';
      } else if (masteryPercent < 70) {
        statusText = 'NEEDS REMEDIAL SKILL PRACTICE';
        statusColor = 'warning';
      }

      return {
        student,
        attendancePercent,
        totalTasks: availableSyllabi.length,
        masteredCount: masteredEvls.length,
        masteryPercent,
        isEligible,
        statusText,
        statusColor
      };
    });
  }, [groupStudents, studentAttendanceMatrix, availableSyllabi, db.evaluations]);

  // ----------------------------------------------------
  // 5. DATA COMPUTATION: OJT & EMPLOYMENT OUTCOMES
  // ----------------------------------------------------
  const outcomeStats = useMemo(() => {
    const ojtList = db.ojtRecords || [];
    const placementList = db.placements || [];
    const groupStudentsCount = groupStudents.length;

    const groupOjt = ojtList.filter((o) => groupStudents.some((s) => s.id === o.studentId));
    const groupPlacements = placementList.filter((p) => groupStudents.some((s) => s.id === p.studentId));

    const inOjtCount = groupOjt.filter((o) => o.status === 'Ongoing').length;
    const completedOjtCount = groupOjt.filter((o) => o.status === 'Completed').length;
    const placedCount = groupPlacements.filter((p) => p.status === 'Placed').length;
    const placementRate =
      groupStudentsCount > 0 ? Math.round((placedCount / groupStudentsCount) * 100) : 0;

    // Employer leaderboard
    const employerHires = {};
    groupPlacements.forEach((p) => {
      const emp = db.employers.find((e) => e.id === p.employerId);
      const name = emp?.companyName || 'Private Enterprise';
      employerHires[name] = (employerHires[name] || 0) + 1;
    });

    return {
      totalStudents: groupStudentsCount,
      inOjtCount,
      completedOjtCount,
      placedCount,
      placementRate,
      groupPlacements,
      employerHires
    };
  }, [groupStudents, db.ojtRecords, db.placements, db.employers]);

  // ----------------------------------------------------
  // WHATSAPP SHARE GENERATOR FOR ACTIVE TAB
  // ----------------------------------------------------
  const getActiveTabShareText = () => {
    const orgHeader = `*KITE CAREGIVER TRAINING CENTER / ग्लोबल एरा प्राविधिक स्कुल*\n`;
    const metaHeader = `• *Group:* ${selectedGroup?.groupCode || '—'} | *Course:* ${selectedCourse?.title || 'Vocational'}\n• *Instructor:* ${trainer?.name || '—'}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    if (activeTab === 0) {
      // Monthly Attendance Summary
      const avgAtt = Math.round(
        studentAttendanceMatrix.reduce((acc, x) => acc + x.attendancePercent, 0) /
          Math.max(1, studentAttendanceMatrix.length)
      );
      return (
        orgHeader +
        `📊 *MONTHLY ATTENDANCE REPORT (${selectedMonth})*\n` +
        metaHeader +
        `• *Total Enrolled Trainees:* ${groupStudents.length}\n` +
        `• *Average Group Attendance:* ${avgAtt}%\n` +
        `• *Sessions Held in Month:* ${monthDates.length} Days\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_CTEVT requirement: 80% mandatory attendance for certification._`
      );
    } else if (activeTab === 1) {
      // Dropout Red Alert
      return (
        orgHeader +
        `🚨 *DROPOUT AT-RISK RED ALERT LIST*\n` +
        metaHeader +
        `• *Total Trainees At-Risk:* ${atRiskStudents.length} Students\n` +
        atRiskStudents
          .map(
            (r, i) =>
              `${i + 1}. ${r.student.name} (${r.student.tgid}): ${r.riskLevel} [Att: ${r.attendancePercent}%, Absent: ${r.absentCount} days]`
          )
          .join('\n') +
        `\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Urgent guardian contact and counseling required immediately._`
      );
    } else if (activeTab === 2) {
      // Syllabus Progress
      return (
        orgHeader +
        `📚 *SYLLABUS & CURRICULUM DELIVERY PROGRESS*\n` +
        metaHeader +
        `• *Total Course Target:* ${syllabusProgressData.totalTargetHours} Hours\n` +
        `• *Actual Hours Delivered:* ${syllabusProgressData.deliveredHours} Hours (${syllabusProgressData.progressPercent}%)\n` +
        `• *Completed Units:* ${syllabusProgressData.completedUnitsCount} / ${syllabusProgressData.totalUnitsCount} Units\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Certified delivery report submitted to institutional administration._`
      );
    } else if (activeTab === 3) {
      // NSTB Competency Readiness
      const eligibleCount = nstbReadinessList.filter((x) => x.isEligible).length;
      return (
        orgHeader +
        `🎓 *CTEVT NSTB SKILL TEST READINESS AUDIT*\n` +
        metaHeader +
        `• *Total Evaluated:* ${groupStudents.length} Trainees\n` +
        `• *Eligible for National Skill Test:* ${eligibleCount} Students (${Math.round((eligibleCount / Math.max(1, groupStudents.length)) * 100)}%)\n` +
        `• *Needs Remedial Practice:* ${groupStudents.length - eligibleCount} Students\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Official NSTB eligibility verification register._`
      );
    } else {
      // Placement Outcomes
      return (
        orgHeader +
        `💼 *TRAINING TO EMPLOYMENT OUTCOME REPORT*\n` +
        metaHeader +
        `• *Enrolled Cohort:* ${outcomeStats.totalStudents} Trainees\n` +
        `• *Currently in OJT:* ${outcomeStats.inOjtCount} Students\n` +
        `• *Job Placed Graduates:* ${outcomeStats.placedCount} Students (${outcomeStats.placementRate}% Placement Rate)\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Global Era Technical School outcome-oriented TVET tracking._`
      );
    }
  };

  // WhatsApp Alert to specific guardian/student
  const getGuardianWarningUrl = (student, reasons, attPercent) => {
    const text =
      `*ग्लोबल एरा प्राविधिक स्कुल (GLOBAL ERA TECHNICAL SCHOOL)*\n` +
      `आदरणीय अभिभावक / विद्यार्थीज्यू,\n\n` +
      `प्रशिक्षार्थी: *${student.name}* (TGID: ${student.tgid})\n` +
      `समूह: *${selectedGroup?.groupCode || '—'}* (${selectedCourse?.title || 'तालिम'})\n\n` +
      `⚠️ *अति जरुरी सूचना (हाजिरी सतर्कता):*\n` +
      `यहाँको हालसम्मको उपस्थिति *${attPercent}%* मात्र रहेको छ। CTEVT को आधिकारिक नियमानुसार तालिममा कम्तीमा *८०% अनिवार्य उपस्थिति* नभएमा राष्ट्रिय सीप परीक्षण परीक्षा (Skill Test) मा सहभागी हुन र प्रमाणपत्र प्राप्त गर्न पाइँदैन।\n\n` +
      `कृपया तुरुन्तै संस्था प्रशासन वा प्रशिक्षक (${trainer?.name}, सम्पर्क: ${trainer?.phone || 'कार्यालय'}) सँग सम्पर्क राख्नुहुन अनुरोध गरिन्छ।`;

    return getWhatsAppUrl(student.guardianPhone || student.phone || '', text);
  };

  return (
    <Box>
      {/* 1. Header Title & Top Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AssessmentIcon sx={{ color: '#1a56b0', fontSize: 34 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#152238' }}>
              Reports & Analytics (प्रतिवेदन तथा विश्लेषण)
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#647089', mt: 0.5 }}>
            Institutional TVET reports compliant with CTEVT standards: Monthly Attendance, Dropout Red Alerts, Syllabus, NSTB Readiness & Placements.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {/* A4 Printable Official Report */}
          <Button
            variant="contained"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={() => {
              if (activeTab === 0) setReportDocType('ATTENDANCE');
              else if (activeTab === 1) setReportDocType('DROPOUT');
              else if (activeTab === 2) setReportDocType('SYLLABUS');
              else if (activeTab === 3) setReportDocType('NSTB');
              else setReportDocType('PLACEMENT');
              setOfficialModalOpen(true);
            }}
            sx={{ fontWeight: 800 }}
          >
            A4 Official Report / PDF
          </Button>

          {/* WhatsApp Share */}
          <Button
            variant="outlined"
            color="success"
            startIcon={<WhatsAppIcon />}
            component="a"
            href={getWhatsAppUrl(trainer?.phone || '', getActiveTabShareText())}
            target="_blank"
            sx={{ fontWeight: 700 }}
          >
            WhatsApp Summary
          </Button>
        </Box>
      </Box>

      {/* 2. Global Filter Bar: Group Selector & Month Selector */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={5}>
            <TextField
              select
              label="Select Training Group"
              fullWidth
              size="small"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
            >
              {myGroups.map((grp) => {
                const c = db.courses.find((x) => x.id === grp.courseId);
                return (
                  <MenuItem key={grp.id} value={grp.id}>
                    {grp.groupCode} — {c?.title} (Shift {grp.shift})
                  </MenuItem>
                );
              })}
            </TextField>
          </Grid>

          {activeTab === 0 && (
            <Grid item xs={12} sm={6} md={3.5}>
              <TextField
                type="month"
                label="Select Attendance Month"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </Grid>
          )}

          <Grid item xs={12} sm={6} md={activeTab === 0 ? 3.5 : 7}>
            <TextField
              size="small"
              placeholder="Search trainee name or TGID..."
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: '#647089' }} />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
        </Grid>
      </Card>

      {/* 3. Report Category Tabs */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: '1px solid #e2e8f0',
            bgcolor: '#f8fafc',
            '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', minHeight: 52 }
          }}
        >
          <Tab
            icon={<FactCheckIcon fontSize="small" />}
            iconPosition="start"
            label="१. Monthly Attendance Matrix"
          />
          <Tab
            icon={
              <Badge badgeContent={atRiskStudents.length} color="error">
                <WarningAmberIcon fontSize="small" />
              </Badge>
            }
            iconPosition="start"
            label="२. Dropout At-Risk Red Alert"
          />
          <Tab
            icon={<MenuBookIcon fontSize="small" />}
            iconPosition="start"
            label="३. Syllabus & Hours Completion"
          />
          <Tab
            icon={<VerifiedUserIcon fontSize="small" />}
            iconPosition="start"
            label="४. CTEVT NSTB Skill Readiness"
          />
          <Tab
            icon={<WorkIcon fontSize="small" />}
            iconPosition="start"
            label="५. OJT & Employment Outcomes"
          />
        </Tabs>
      </Card>

      {/* ======================================================== */}
      {/* TAB 0: MONTHLY ATTENDANCE MATRIX & REGISTER             */}
      {/* ======================================================== */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                मासिक हाजिरी कट्टा (Month: {selectedMonth})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label="P = Present" size="small" sx={{ bgcolor: '#e5f8ee', color: '#16834b', fontWeight: 800 }} />
                <Chip label="A = Absent" size="small" sx={{ bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 800 }} />
                <Chip label="L = Late" size="small" sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 800 }} />
              </Box>
            </Box>

            <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700 }}>
              * CTEVT नियमानुसार परीक्षामा सामेल हुन कम्तीमा ८०% उपस्थिति अनिवार्य छ।
            </Typography>
          </Box>

          <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader size="small">
                <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900, width: 45, textAlign: 'center' }}>S.N.</TableCell>
                    <TableCell sx={{ fontWeight: 900, minWidth: 160 }}>Trainee Name</TableCell>
                    <TableCell sx={{ fontWeight: 900, width: 95 }}>TGID</TableCell>
                    {monthDates.map((d) => (
                      <TableCell key={d} sx={{ fontWeight: 800, textAlign: 'center', p: 0.5, fontSize: '0.72rem', minWidth: 32 }}>
                        {d.split('-')[2]}
                      </TableCell>
                    ))}
                    <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 60, bgcolor: '#e5f8ee' }}>P</TableCell>
                    <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 60, bgcolor: '#fee2e2' }}>A</TableCell>
                    <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 60, bgcolor: '#fef3c7' }}>L</TableCell>
                    <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 75 }}>Att %</TableCell>
                    <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 110 }}>CTEVT Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {studentAttendanceMatrix
                    .filter((m) => {
                      const q = searchTerm.toLowerCase();
                      return (
                        m.student.name.toLowerCase().includes(q) ||
                        m.student.tgid.toLowerCase().includes(q)
                      );
                    })
                    .map((item, idx) => {
                      const isCompliant = item.attendancePercent >= 80;
                      const isWarning = item.attendancePercent >= 70 && item.attendancePercent < 80;

                      return (
                        <TableRow key={item.student.id} hover>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: '#647089' }}>
                            {idx + 1}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>
                            {item.student.name}
                          </TableCell>
                          <TableCell sx={{ color: '#647089', fontSize: '0.82rem' }}>
                            {item.student.tgid}
                          </TableCell>
                          {monthDates.map((d) => {
                            const code = item.dayRecords[d];
                            let bg = '#ffffff';
                            let fg = '#94a3b8';
                            if (code === 'P') {
                              bg = '#e5f8ee';
                              fg = '#16834b';
                            } else if (code === 'A') {
                              bg = '#fee2e2';
                              fg = '#dc2626';
                            } else if (code === 'L') {
                              bg = '#fef3c7';
                              fg = '#b45309';
                            }
                            return (
                              <TableCell
                                key={d}
                                sx={{
                                  textAlign: 'center',
                                  p: 0.5,
                                  fontWeight: 800,
                                  bgcolor: bg,
                                  color: fg,
                                  fontSize: '0.75rem',
                                  borderRight: '1px solid #f1f5f9'
                                }}
                              >
                                {code}
                              </TableCell>
                            );
                          })}
                          <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: '#16834b' }}>
                            {item.presentCount}
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: '#dc2626' }}>
                            {item.absentCount}
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: '#b45309' }}>
                            {item.lateCount}
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 900 }}>
                            {item.attendancePercent}%
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <Chip
                              label={isCompliant ? 'Compliant' : isWarning ? 'Warning' : 'Critical'}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: '0.7rem',
                                bgcolor: isCompliant ? '#e5f8ee' : isWarning ? '#fef3c7' : '#fee2e2',
                                color: isCompliant ? '#16834b' : isWarning ? '#b45309' : '#dc2626'
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {/* ======================================================== */}
      {/* TAB 1: DROPOUT AT-RISK RED ALERT                         */}
      {/* ======================================================== */}
      {activeTab === 1 && (
        <Box>
          <Alert severity={atRiskStudents.length > 0 ? 'error' : 'success'} sx={{ mb: 3 }}>
            {atRiskStudents.length > 0 ? (
              <b>
                {atRiskStudents.length} जना प्रशिक्षार्थी जोखिममा (At-Risk) फेला परे। उपस्थिति ८०% भन्दा कम वा धेरै दिन गयल भएका कारण CTEVT नियम अनुसार परीक्षा रोकिन सक्छ।
              </b>
            ) : (
              <b>बधाई छ! यस समूहका सम्पूर्ण प्रशिक्षार्थीको उपस्थिति र सीप सिकाइ सन्तोषजनक छ।</b>
            )}
          </Alert>

          <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900, width: 45, textAlign: 'center' }}>S.N.</TableCell>
                    <TableCell sx={{ fontWeight: 900, minWidth: 180 }}>Trainee</TableCell>
                    <TableCell sx={{ fontWeight: 900, width: 120 }}>Risk Level</TableCell>
                    <TableCell sx={{ fontWeight: 900, width: 95 }}>Attendance %</TableCell>
                    <TableCell sx={{ fontWeight: 900, minWidth: 260 }}>Identified Risk Causes</TableCell>
                    <TableCell sx={{ fontWeight: 900, width: 150 }}>Emergency Contacts</TableCell>
                    <TableCell sx={{ fontWeight: 900, width: 180, textAlign: 'right' }}>1-Click Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {atRiskStudents
                    .filter((r) => {
                      const q = searchTerm.toLowerCase();
                      return (
                        r.student.name.toLowerCase().includes(q) ||
                        r.student.tgid.toLowerCase().includes(q)
                      );
                    })
                    .map((item, idx) => {
                      const isCritical = item.riskLevel === 'CRITICAL';
                      return (
                        <TableRow key={item.student.id} hover sx={{ bgcolor: isCritical ? '#fff8f8' : '#ffffff' }}>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: '#647089' }}>
                            {idx + 1}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar
                                src={item.student.photoUrl}
                                sx={{ width: 36, height: 36, bgcolor: isCritical ? '#dc2626' : '#b45309', fontWeight: 800 }}
                              >
                                {item.student.name?.[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                  {item.student.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#647089' }}>
                                  {item.student.tgid}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={<WarningAmberIcon />}
                              label={item.riskLevel}
                              size="small"
                              sx={{
                                fontWeight: 900,
                                bgcolor: isCritical ? '#fee2e2' : '#fef3c7',
                                color: isCritical ? '#dc2626' : '#b45309'
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 900, color: isCritical ? '#dc2626' : '#b45309' }}>
                            {item.attendancePercent}%
                          </TableCell>
                          <TableCell>
                            <Stack spacing={0.5}>
                              {item.reasons.map((r, ri) => (
                                <Typography key={ri} variant="caption" sx={{ color: '#475569', display: 'block' }}>
                                  • {r}
                                </Typography>
                              ))}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {item.student.phone || '—'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#647089', display: 'block' }}>
                              Guardian: {item.student.guardianPhone || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'right' }}>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              startIcon={<WhatsAppIcon />}
                              component="a"
                              href={getGuardianWarningUrl(item.student, item.reasons, item.attendancePercent)}
                              target="_blank"
                              sx={{ fontWeight: 800, fontSize: '0.75rem', px: 1.5 }}
                            >
                              WhatsApp Alert
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {atRiskStudents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 5, color: '#16834b', fontWeight: 800 }}>
                        No trainees at risk! All trainees are meeting the 80% CTEVT attendance criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {/* ======================================================== */}
      {/* TAB 2: SYLLABUS & HOURS COMPLETION REPORT                */}
      {/* ======================================================== */}
      {activeTab === 2 && (
        <Box>
          {/* Top KPI Cards */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 2.5 }}>
                <Typography variant="caption" sx={{ color: '#647089', fontWeight: 800 }}>
                  CURRICULUM DURATION
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', mt: 0.5 }}>
                  {syllabusProgressData.totalTargetHours} <span style={{ fontSize: '1rem', color: '#647089' }}>Hours</span>
                </Typography>
                <Typography variant="caption" sx={{ color: '#647089' }}>
                  CTEVT Standard Curriculum Requirement
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 2.5 }}>
                <Typography variant="caption" sx={{ color: '#647089', fontWeight: 800 }}>
                  DELIVERED IN LOG BOOK
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#1a56b0', mt: 0.5 }}>
                  {syllabusProgressData.deliveredHours} <span style={{ fontSize: '1rem', color: '#647089' }}>Hours</span>
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <LinearProgress
                    variant="determinate"
                    value={syllabusProgressData.progressPercent}
                    sx={{ flexGrow: 1, height: 7, borderRadius: 3 }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 800 }}>
                    {syllabusProgressData.progressPercent}%
                  </Typography>
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 2.5 }}>
                <Typography variant="caption" sx={{ color: '#647089', fontWeight: 800 }}>
                  SYLLABUS UNITS COMPLETED
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#16834b', mt: 0.5 }}>
                  {syllabusProgressData.completedUnitsCount} / {syllabusProgressData.totalUnitsCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#647089' }}>
                  {syllabusProgressData.totalUnitsCount - syllabusProgressData.completedUnitsCount} units remaining
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Unit Breakdown Table */}
          <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900, width: 50, textAlign: 'center' }}>Unit</TableCell>
                    <TableCell sx={{ fontWeight: 900, minWidth: 220 }}>Unit Title & Learning Outcome</TableCell>
                    <TableCell sx={{ fontWeight: 900, width: 120 }}>Curriculum Target</TableCell>
                    <TableCell sx={{ fontWeight: 900, width: 130 }}>Delivered in Log</TableCell>
                    <TableCell sx={{ fontWeight: 900, width: 130 }}>Delivery Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {syllabusProgressData.unitBreakdown.map((item) => (
                    <TableRow key={item.unit.id} hover>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 900, color: '#1a56b0' }}>
                        {item.unit.unitNo}
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                          {item.unit.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#647089', display: 'block' }}>
                          Outcome: {item.unit.learningOutcome}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>
                        {item.unit.totalHours} Hours
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#1a56b0' }}>
                        {item.hoursDeliveredForUnit} Hours
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={item.isCompleted ? <CheckCircleIcon /> : <HourglassEmptyIcon />}
                          label={item.isCompleted ? 'Completed' : item.isPlanned ? 'In Progress' : 'Pending'}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            bgcolor: item.isCompleted ? '#e5f8ee' : item.isPlanned ? '#fef3c7' : '#f1f5f9',
                            color: item.isCompleted ? '#16834b' : item.isPlanned ? '#b45309' : '#647089'
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {/* ======================================================== */}
      {/* TAB 3: CTEVT NSTB SKILL READINESS AUDIT                  */}
      {/* ======================================================== */}
      {activeTab === 3 && (
        <Box>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
              राष्ट्रिय सीप परीक्षण समिति (NSTB) परीक्षा योग्यता अडिट
            </Typography>
            <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700 }}>
              * योग्यता मापदण्ड: न्यूनतम ८०% उपस्थिति + कम्तीमा ७०% सीप दक्षता प्रमाणित।
            </Typography>
          </Box>

          <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900, width: 45, textAlign: 'center' }}>S.N.</TableCell>
                    <TableCell sx={{ fontWeight: 900, minWidth: 180 }}>Trainee Name</TableCell>
                    <TableCell sx={{ fontWeight: 900, width: 95 }}>TGID</TableCell>
                    <TableCell sx={{ fontWeight: 900, width: 110, textAlign: 'center' }}>Attendance %</TableCell>
                    <TableCell sx={{ fontWeight: 900, width: 140, textAlign: 'center' }}>Skills Mastered</TableCell>
                    <TableCell sx={{ fontWeight: 900, width: 110, textAlign: 'center' }}>Mastery %</TableCell>
                    <TableCell sx={{ fontWeight: 900, width: 220, textAlign: 'center' }}>NSTB Eligibility Recommendation</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {nstbReadinessList
                    .filter((item) => {
                      const q = searchTerm.toLowerCase();
                      return (
                        item.student.name.toLowerCase().includes(q) ||
                        item.student.tgid.toLowerCase().includes(q)
                      );
                    })
                    .map((item, idx) => (
                      <TableRow key={item.student.id} hover>
                        <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: '#647089' }}>
                          {idx + 1}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>
                          {item.student.name}
                        </TableCell>
                        <TableCell sx={{ color: '#647089', fontSize: '0.82rem' }}>
                          {item.student.tgid}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: item.attendancePercent >= 80 ? '#16834b' : '#dc2626' }}>
                          {item.attendancePercent}%
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: '#1a56b0' }}>
                          {item.masteredCount} / {item.totalTasks} Tasks
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', fontWeight: 800 }}>
                          {item.masteryPercent}%
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip
                            icon={item.isEligible ? <CheckCircleIcon /> : <CancelIcon />}
                            label={item.statusText}
                            size="small"
                            color={item.statusColor}
                            sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {/* ======================================================== */}
      {/* TAB 4: OJT & EMPLOYMENT OUTCOMES                         */}
      {/* ======================================================== */}
      {activeTab === 4 && (
        <Box>
          {/* Outcome Metric Cards */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={6} md={3}>
              <Card sx={{ p: 2 }}>
                <Typography variant="caption" sx={{ color: '#647089', fontWeight: 800 }}>
                  TOTAL ENROLLED
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', mt: 0.5 }}>
                  {outcomeStats.totalStudents}
                </Typography>
                <Typography variant="caption" sx={{ color: '#647089' }}>
                  Registered Trainees
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={6} md={3}>
              <Card sx={{ p: 2 }}>
                <Typography variant="caption" sx={{ color: '#647089', fontWeight: 800 }}>
                  OJT TRAINEES
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#1a56b0', mt: 0.5 }}>
                  {outcomeStats.inOjtCount + outcomeStats.completedOjtCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#647089' }}>
                  {outcomeStats.inOjtCount} Ongoing • {outcomeStats.completedOjtCount} Completed
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={6} md={3}>
              <Card sx={{ p: 2 }}>
                <Typography variant="caption" sx={{ color: '#647089', fontWeight: 800 }}>
                  JOB PLACED (EPP)
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#16834b', mt: 0.5 }}>
                  {outcomeStats.placedCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#16834b', fontWeight: 700 }}>
                  Employment Verified
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={6} md={3}>
              <Card sx={{ p: 2 }}>
                <Typography variant="caption" sx={{ color: '#647089', fontWeight: 800 }}>
                  PLACEMENT SUCCESS RATE
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#16834b', mt: 0.5 }}>
                  {outcomeStats.placementRate}%
                </Typography>
                <Typography variant="caption" sx={{ color: '#647089' }}>
                  Trainees Formally Employed
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Placed Trainees Table */}
          <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Verified Placements & Industry Partners (रोजगारी विवरण)
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900, width: 45, textAlign: 'center' }}>S.N.</TableCell>
                    <TableCell sx={{ fontWeight: 900, minWidth: 160 }}>Graduate Name</TableCell>
                    <TableCell sx={{ fontWeight: 900, minWidth: 180 }}>Employer / Company</TableCell>
                    <TableCell sx={{ fontWeight: 900, minWidth: 140 }}>Job Designation</TableCell>
                    <TableCell sx={{ fontWeight: 900, width: 120 }}>Monthly Salary</TableCell>
                    <TableCell sx={{ fontWeight: 900, width: 110 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {outcomeStats.groupPlacements.map((p, idx) => {
                    const std = db.students.find((s) => s.id === p.studentId);
                    const emp = db.employers.find((e) => e.id === p.employerId);
                    return (
                      <TableRow key={p.id} hover>
                        <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: '#647089' }}>
                          {idx + 1}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>
                          {std?.name || 'Graduate'}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#1a56b0' }}>
                          {emp?.companyName || 'Private Enterprise'}
                        </TableCell>
                        <TableCell>{p.position || 'Vocational Specialist'}</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#16834b' }}>
                          NPR {p.salary ? Number(p.salary).toLocaleString() : '18,000'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={p.status}
                            size="small"
                            color="success"
                            sx={{ fontWeight: 800 }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {outcomeStats.groupPlacements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
                        No graduates currently placed for this group yet. Track progress through OJT and Placements tabs.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {/* ======================================================== */}
      {/* 4. OFFICIAL CTEVT STANDARD A4 PRINTABLE MODAL           */}
      {/* ======================================================== */}
      <OfficialDocumentModal
        open={officialModalOpen}
        onClose={() => setOfficialModalOpen(false)}
        docType="REPORT"
        title={
          reportDocType === 'ATTENDANCE'
            ? 'MONTHLY ATTENDANCE REGISTER & MATRIX'
            : reportDocType === 'DROPOUT'
            ? 'DROPOUT RISK ASSESSMENT REPORT'
            : reportDocType === 'SYLLABUS'
            ? 'SYLLABUS & CURRICULUM DELIVERY AUDIT'
            : reportDocType === 'NSTB'
            ? 'CTEVT NSTB SKILL TEST ELIGIBILITY REGISTER'
            : 'TRAINING TO EMPLOYMENT OUTCOME AUDIT'
        }
        nepaliTitle={
          reportDocType === 'ATTENDANCE'
            ? 'मासिक हाजिरी कट्टा तथा अभिलेख'
            : reportDocType === 'DROPOUT'
            ? 'जोखिममा रहेका प्रशिक्षार्थी विवरण'
            : reportDocType === 'SYLLABUS'
            ? 'पाठ्यक्रम सम्पन्नता प्रगति प्रतिवेदन'
            : reportDocType === 'NSTB'
            ? 'राष्ट्रिय सीप परीक्षण समिति योग्यता अभिलेख'
            : 'OJT तथा रोजगारी नतिजा प्रतिवेदन'
        }
        group={selectedGroup}
        course={selectedCourse}
        trainer={trainer}
        metadata={{
          dateRange: `Report Generated: ${new Date().toISOString().slice(0, 10)}`
        }}
        shareText={getActiveTabShareText()}
        sharePhone={trainer?.phone || ''}
      >
        {/* Printable Content depending on active reportDocType */}
        {reportDocType === 'ATTENDANCE' && (
          <Box>
            <Table size="small" sx={{ border: '1px solid #0f172a', '& th, & td': { border: '1px solid #cbd5e1', fontSize: '0.75rem', p: 0.6 } }}>
              <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 35 }}>क्र.सं.</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>प्रशिक्षार्थीको नाम</TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 80 }}>TGID</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 50 }}>उपस्थित</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 50 }}>गयल</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 50 }}>ढिला</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 65 }}>प्रतिशत (%)</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 90 }}>कैफियत</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {studentAttendanceMatrix.map((item, idx) => (
                  <TableRow key={item.student.id}>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{item.student.name}</TableCell>
                    <TableCell>{item.student.tgid}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 800 }}>{item.presentCount}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 800 }}>{item.absentCount}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 800 }}>{item.lateCount}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 900, color: item.attendancePercent >= 80 ? '#16834b' : '#dc2626' }}>
                      {item.attendancePercent}%
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>
                      {item.attendancePercent >= 80 ? 'नियमित' : 'चेतावनी'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}

        {reportDocType === 'DROPOUT' && (
          <Box>
            <Table size="small" sx={{ border: '1px solid #0f172a', '& th, & td': { border: '1px solid #cbd5e1', fontSize: '0.8rem', p: 0.8 } }}>
              <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 35 }}>क्र.सं.</TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 140 }}>प्रशिक्षार्थी नाम</TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 90 }}>TGID</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 75 }}>हाजिरी %</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>जोखिमका कारणहरू</TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 120 }}>सम्पर्क नम्बर</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {atRiskStudents.map((item, idx) => (
                  <TableRow key={item.student.id}>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{item.student.name}</TableCell>
                    <TableCell>{item.student.tgid}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 900, color: '#dc2626' }}>
                      {item.attendancePercent}%
                    </TableCell>
                    <TableCell>{item.reasons.join(', ')}</TableCell>
                    <TableCell>{item.student.guardianPhone || item.student.phone || '—'}</TableCell>
                  </TableRow>
                ))}
                {atRiskStudents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3, color: '#16834b', fontWeight: 800 }}>
                      No trainees at risk of dropout.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        )}

        {reportDocType === 'SYLLABUS' && (
          <Box>
            <Table size="small" sx={{ border: '1px solid #0f172a', '& th, & td': { border: '1px solid #cbd5e1', fontSize: '0.8rem', p: 0.8 } }}>
              <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 45 }}>इकाइ</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>पाठ्यक्रम शीर्षक तथा सिकाइ उपलब्धि</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 80 }}>लक्षित घन्टा</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 80 }}>सम्पन्न घन्टा</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 85 }}>अवस्था</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {syllabusProgressData.unitBreakdown.map((item) => (
                  <TableRow key={item.unit.id}>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 800 }}>Unit {item.unit.unitNo}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{item.unit.title}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 800 }}>{item.unit.totalHours}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 800 }}>{item.hoursDeliveredForUnit}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 800 }}>
                      {item.isCompleted ? 'सम्पन्न' : 'बाँकी'}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell colSpan={2} sx={{ fontWeight: 900, textAlign: 'right' }}>
                    कुल सम्पन्न घन्टा (DELIVERED HOURS):
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', fontWeight: 900 }}>
                    {syllabusProgressData.totalTargetHours}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', fontWeight: 900, color: '#1a56b0' }}>
                    {syllabusProgressData.deliveredHours}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', fontWeight: 900 }}>
                    {syllabusProgressData.progressPercent}%
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        )}

        {reportDocType === 'NSTB' && (
          <Box>
            <Table size="small" sx={{ border: '1px solid #0f172a', '& th, & td': { border: '1px solid #cbd5e1', fontSize: '0.8rem', p: 0.8 } }}>
              <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 35 }}>क्र.सं.</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>प्रशिक्षार्थीको नाम</TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 85 }}>TGID</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 75 }}>हाजिरी %</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 85 }}>दक्षता %</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 140 }}>NSTB सिफारिस</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {nstbReadinessList.map((item, idx) => (
                  <TableRow key={item.student.id}>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{item.student.name}</TableCell>
                    <TableCell>{item.student.tgid}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: item.attendancePercent >= 80 ? '#16834b' : '#dc2626' }}>
                      {item.attendancePercent}%
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 800 }}>{item.masteryPercent}%</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 900, color: item.isEligible ? '#16834b' : '#dc2626' }}>
                      {item.isEligible ? 'योग्य (Recommended)' : 'अयोग्य (Not Ready)'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}

        {reportDocType === 'PLACEMENT' && (
          <Box>
            <Table size="small" sx={{ border: '1px solid #0f172a', '& th, & td': { border: '1px solid #cbd5e1', fontSize: '0.8rem', p: 0.8 } }}>
              <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 35 }}>क्र.सं.</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>प्रशिक्षार्थीको नाम</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>रोजगारदाता (Employer)</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>पद (Job Designation)</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 95 }}>तलब (NPR)</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 85 }}>अवस्था</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {outcomeStats.groupPlacements.map((p, idx) => {
                  const std = db.students.find((s) => s.id === p.studentId);
                  const emp = db.employers.find((e) => e.id === p.employerId);
                  return (
                    <TableRow key={p.id}>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{std?.name || 'Trainee'}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{emp?.companyName || 'Private Enterprise'}</TableCell>
                      <TableCell>{p.position || 'Specialist'}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 800 }}>
                        {p.salary ? Number(p.salary).toLocaleString() : '18,000'}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: '#16834b' }}>
                        {p.status}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </OfficialDocumentModal>
    </Box>
  );
}
