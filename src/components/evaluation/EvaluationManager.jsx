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
  FormControlLabel,
  Switch,
  Avatar,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  LinearProgress,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import PrintIcon from '@mui/icons-material/Print';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CloseIcon from '@mui/icons-material/Close';
import { loadDB, saveDB } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { getWhatsAppUrl } from '../../services/exportUtils';
import OfficialDocumentModal from '../common/OfficialDocumentModal';

export default function EvaluationManager() {
  const [db, setDb] = useState(loadDB());
  const { currentUser, isTrainer } = useAuth();

  const myGroups = isTrainer
    ? db.trainingGroups.filter((g) => g.trainerId === currentUser?.trainerId)
    : db.trainingGroups;

  const [selectedGroupId, setSelectedGroupId] = useState(myGroups[0]?.id || db.trainingGroups[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState('ALL');
  const [openDialog, setOpenDialog] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'card'
  const [searchTerm, setSearchTerm] = useState('');

  // Official A4 Modal state
  const [officialModalOpen, setOfficialModalOpen] = useState(false);
  const [modalTargetStudent, setModalTargetStudent] = useState(null); // null = entire group, studentObj = individual student dossier

  const selectedGroup = db.trainingGroups.find((g) => g.id === selectedGroupId);
  const selectedCourse = db.courses.find((c) => c.id === selectedGroup?.courseId);
  const groupStudents = (db.students || []).filter((s) => s.groupId === selectedGroupId);
  const availableSyllabi = (db.syllabi || []).filter((s) => s.courseId === selectedCourse?.id);
  const trainer = db.trainers.find((t) => t.id === selectedGroup?.trainerId) || { name: 'Assigned Trainer', phone: '' };

  const [formData, setFormData] = useState({
    groupId: selectedGroupId,
    studentId: groupStudents[0]?.id || '',
    syllabusId: availableSyllabi[0]?.id || '',
    mastered: true,
    areasToImprove: '',
    trainerPlan: 'Provide supervised practice on operational precision.',
    evaluatorName: currentUser?.name || 'Trainer',
    evaluatedAt: new Date().toISOString().slice(0, 10)
  });

  let groupEvaluations = (db.evaluations || []).filter((e) => e.groupId === selectedGroupId);
  if (selectedStudentId !== 'ALL') {
    groupEvaluations = groupEvaluations.filter((e) => e.studentId === selectedStudentId);
  }

  const filteredEvaluations = groupEvaluations.filter((evl) => {
    const std = db.students.find((s) => s.id === evl.studentId);
    const syl = db.syllabi.find((s) => s.id === evl.syllabusId);
    const q = searchTerm.toLowerCase();
    return (
      (std?.name || '').toLowerCase().includes(q) ||
      (std?.tgid || '').toLowerCase().includes(q) ||
      (syl?.title || '').toLowerCase().includes(q) ||
      (evl.areasToImprove || '').toLowerCase().includes(q) ||
      (evl.trainerPlan || '').toLowerCase().includes(q) ||
      (evl.evaluatorName || '').toLowerCase().includes(q)
    );
  });

  // Calculate statistics
  const totalEvaluations = groupEvaluations.length;
  const masteredCount = groupEvaluations.filter((e) => e.mastered).length;
  const inProgressCount = totalEvaluations - masteredCount;
  const masteryRatePercent = totalEvaluations > 0 ? Math.round((masteredCount / totalEvaluations) * 100) : 0;

  const handleOpenAdd = () => {
    setFormData({
      groupId: selectedGroupId,
      studentId: selectedStudentId !== 'ALL' ? selectedStudentId : '',
      syllabusId: '',
      mastered: true,
      areasToImprove: '',
      trainerPlan: '',
      evaluatorName: currentUser?.name || 'Trainer',
      evaluatedAt: new Date().toISOString().slice(0, 10)
    });
    setOpenDialog(true);
  };

  const handleSave = () => {
    if (!formData.studentId || !formData.syllabusId) {
      alert('Student and Syllabus Unit are required.');
      return;
    }

    const newId = `EVL-${Date.now()}`;
    const newEntry = { id: newId, ...formData };
    const updatedList = [newEntry, ...(db.evaluations || [])];

    // Also push to student timeline
    const syl = db.syllabi.find((s) => s.id === formData.syllabusId);
    const updatedTimeline = [
      {
        id: `TL-${Date.now()}`,
        studentId: formData.studentId,
        eventType: 'Evaluation',
        title: formData.mastered ? `Skill Mastered: ${syl?.title}` : `Evaluated: ${syl?.title} (In Progress)`,
        description: `Evaluated by ${formData.evaluatorName}. Plan: ${formData.trainerPlan || 'Standard practice'}`,
        createdAt: new Date().toISOString()
      },
      ...(db.studentTimelines || [])
    ];

    const nextDb = { ...db, evaluations: updatedList, studentTimelines: updatedTimeline };
    saveDB(nextDb);
    setDb(nextDb);
    setOpenDialog(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this evaluation record?')) {
      const nextDb = {
        ...db,
        evaluations: db.evaluations.filter((x) => x.id !== id)
      };
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  // WhatsApp share generators
  const getSingleStudentShareText = (student) => {
    const studentEvls = (db.evaluations || []).filter((e) => e.studentId === student.id);
    const studentMastered = studentEvls.filter((e) => e.mastered).length;
    return (
      `*KITE CAREGIVER TRAINING CENTER / ग्लोबल एरा प्राविधिक स्कुल*\n` +
      `🎓 *SKILL COMPETENCY ASSESSMENT REPORT (दक्षता मूल्यांकन)*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Trainee Name:* ${student.name} (${student.tgid})\n` +
      `• *Course:* ${selectedCourse?.title || 'Vocational Training'}\n` +
      `• *Batch:* ${selectedGroup?.groupCode || '—'} (Shift ${selectedGroup?.shift || 'A'})\n` +
      `• *Lead Assessor:* ${trainer?.name || 'Assigned Instructor'}\n` +
      `• *Competencies Mastered:* ${studentMastered} / ${studentEvls.length} Tasks (${studentEvls.length > 0 ? Math.round((studentMastered / studentEvls.length) * 100) : 0}%)\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 *Assessed Skills:*\n` +
      studentEvls.slice(0, 5).map((e, idx) => {
        const syl = db.syllabi.find((s) => s.id === e.syllabusId);
        return `${idx + 1}. ${syl?.title || 'Skill'}: ${e.mastered ? '✅ Mastered' : '⏳ In Progress'}`;
      }).join('\n') +
      (studentEvls.length > 5 ? `\n...and ${studentEvls.length - 5} more assessed competencies.` : '') +
      `\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_Certified competency assessment under CTEVT TVET curriculum._`
    );
  };

  const getBatchAssessmentShareText = () => {
    return (
      `*KITE CAREGIVER TRAINING CENTER / ग्लोबल एरा प्राविधिक स्कुल*\n` +
      `📊 *GROUP COMPETENCY EVALUATION SUMMARY (समूह दक्षता सारांश)*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Batch / Group:* ${selectedGroup?.groupCode || '—'} (Shift ${selectedGroup?.shift || 'A'})\n` +
      `• *Course:* ${selectedCourse?.title || 'Vocational Training'}\n` +
      `• *Instructor:* ${trainer?.name || 'Assigned Instructor'}\n` +
      `• *Total Evaluations Recorded:* ${totalEvaluations}\n` +
      `• *Skills Mastered:* ${masteredCount} (${masteryRatePercent}%)\n` +
      `• *In Progress:* ${inProgressCount}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_Official competency matrix certified by CTEVT accredited institution._`
    );
  };

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AssessmentIcon sx={{ color: '#1a56b0', fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#152238' }}>
              Skill Evaluations (दक्षता मूल्यांकन)
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#647089', mt: 0.5 }}>
            CTEVT Competency-Based Assessment per trainee. Complete performance history preserved without overwriting.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {/* Batch A4 Document / Print */}
          <Button
            variant="outlined"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={() => {
              if (selectedStudentId !== 'ALL') {
                const std = db.students.find((s) => s.id === selectedStudentId);
                setModalTargetStudent(std || null);
              } else {
                setModalTargetStudent(null);
              }
              setOfficialModalOpen(true);
            }}
            sx={{ fontWeight: 700 }}
          >
            A4 Competency Sheet / PDF
          </Button>

          {/* WhatsApp Share */}
          <Button
            variant="outlined"
            color="success"
            startIcon={<WhatsAppIcon />}
            component="a"
            href={getWhatsAppUrl(
              trainer?.phone || '',
              selectedStudentId !== 'ALL'
                ? getSingleStudentShareText(db.students.find((s) => s.id === selectedStudentId) || {})
                : getBatchAssessmentShareText()
            )}
            target="_blank"
            sx={{ fontWeight: 700 }}
          >
            WhatsApp Share
          </Button>

          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd} sx={{ fontWeight: 800 }}>
            + Evaluate Student Skill
          </Button>
        </Box>
      </Box>

      {/* Group & Student Selectors + KPI Summary */}
      <Card sx={{ p: 2.5, mb: 3 }}>
        <Grid container spacing={2.5} alignItems="center">
          <Grid item xs={12} sm={6} md={3.5}>
            <TextField
              select
              label="Select Training Group"
              fullWidth
              value={selectedGroupId}
              onChange={(e) => {
                setSelectedGroupId(e.target.value);
                setSelectedStudentId('ALL');
              }}
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

          <Grid item xs={12} sm={6} md={3.5}>
            <TextField
              select
              label="Filter by Student"
              fullWidth
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              <MenuItem value="ALL">All Enrolled Students ({groupStudents.length})</MenuItem>
              {groupStudents.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name} ({s.tgid})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={5}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1.2fr',
                gap: 1.5,
                bgcolor: '#f8fafc',
                p: 1.5,
                borderRadius: 2,
                border: '1px solid #e2e8f0'
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: 'block' }}>
                  EVALUATIONS
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0f172a' }}>
                  {totalEvaluations}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: 'block' }}>
                  MASTERED
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#16834b' }}>
                  {masteredCount} Skills
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: 'block' }}>
                  MASTERY RATE
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <LinearProgress
                    variant="determinate"
                    value={masteryRatePercent}
                    sx={{ flexGrow: 1, height: 7, borderRadius: 3 }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 800 }}>
                    {masteryRatePercent}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* Filter and View Switcher Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
        <TextField
          size="small"
          placeholder="Search by student, TGID, syllabus skill, or evaluator..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: { xs: '100%', sm: 380 }, bgcolor: '#ffffff' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: '#647089' }} />
              </InputAdornment>
            )
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body2" sx={{ color: '#647089', fontWeight: 700 }}>
            Showing {filteredEvaluations.length} of {groupEvaluations.length} evaluation records
          </Typography>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, next) => next && setViewMode(next)}
            size="small"
          >
            <ToggleButton value="table">
              <ViewListIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="card">
              <ViewModuleIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* 1. TABLE VIEW */}
      {viewMode === 'table' ? (
        <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, width: 60, textAlign: 'center' }}>S.N.</TableCell>
                  <TableCell sx={{ fontWeight: 800, minWidth: 180 }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 800, minWidth: 200 }}>Syllabus Skill / Task</TableCell>
                  <TableCell sx={{ fontWeight: 800, width: 130 }}>Competency</TableCell>
                  <TableCell sx={{ fontWeight: 800, minWidth: 180 }}>Areas to Improve</TableCell>
                  <TableCell sx={{ fontWeight: 800, minWidth: 200 }}>Trainer Action Plan</TableCell>
                  <TableCell sx={{ fontWeight: 800, width: 140 }}>Evaluator & Date</TableCell>
                  <TableCell sx={{ fontWeight: 800, width: 140, textAlign: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEvaluations.map((evl, index) => {
                  const std = db.students.find((s) => s.id === evl.studentId);
                  const syl = db.syllabi.find((s) => s.id === evl.syllabusId);

                  return (
                    <TableRow key={evl.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#647089', textAlign: 'center' }}>
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar src={std?.photoUrl} sx={{ width: 34, height: 34, bgcolor: '#1a56b0', fontWeight: 700 }}>
                            {std?.name?.[0] || 'S'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                              {std?.name || 'Student'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#647089', display: 'block' }}>
                              {std?.tgid}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a56b0' }}>
                          Unit {syl?.unitNo}: {syl?.title || 'Syllabus Task'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#647089' }}>
                          Curriculum: {syl?.totalHours} hrs
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {evl.mastered ? (
                          <Chip icon={<CheckCircleIcon />} label="Mastered" size="small" color="success" sx={{ fontWeight: 800 }} />
                        ) : (
                          <Chip icon={<HourglassEmptyIcon />} label="In Progress" size="small" color="warning" variant="outlined" sx={{ fontWeight: 700 }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: '#475569' }}>
                        {evl.areasToImprove || '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: '#334155' }}>
                        {evl.trainerPlan || '—'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{evl.evaluatorName}</Typography>
                        <Typography variant="caption" sx={{ color: '#647089' }}>{evl.evaluatedAt}</Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        <Tooltip title="View Student Competency Dossier (A4/PDF)">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setModalTargetStudent(std || null);
                              setOfficialModalOpen(true);
                            }}
                            sx={{ color: '#1a56b0' }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Share Evaluation via WhatsApp">
                          <IconButton
                            size="small"
                            component="a"
                            href={getWhatsAppUrl(std?.phone || '', getSingleStudentShareText(std || {}))}
                            target="_blank"
                            sx={{ color: '#16834b' }}
                          >
                            <WhatsAppIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDelete(evl.id)} sx={{ color: '#d5372f' }}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredEvaluations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 5, color: '#94a3b8' }}>
                      {searchTerm
                        ? 'No evaluation records match your search filter.'
                        : 'No evaluations recorded yet for this group. Click "+ Evaluate Student Skill" to evaluate.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : (
        /* 2. CARD VIEW */
        <Grid container spacing={2}>
          {filteredEvaluations.map((evl, index) => {
            const std = db.students.find((s) => s.id === evl.studentId);
            const syl = db.syllabi.find((s) => s.id === evl.syllabusId);

            return (
              <Grid item xs={12} sm={6} md={4} key={evl.id}>
                <Card sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={`S.N. ${index + 1}`} size="small" sx={{ fontWeight: 800, bgcolor: '#f1f5f9' }} />
                      {evl.mastered ? (
                        <Chip icon={<CheckCircleIcon />} label="Mastered" size="small" color="success" sx={{ fontWeight: 800 }} />
                      ) : (
                        <Chip icon={<HourglassEmptyIcon />} label="In Progress" size="small" color="warning" variant="outlined" sx={{ fontWeight: 700 }} />
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ color: '#647089' }}>
                      {evl.evaluatedAt}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Avatar src={std?.photoUrl} sx={{ width: 40, height: 40, bgcolor: '#1a56b0', fontWeight: 800 }}>
                      {std?.name?.[0] || 'S'}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        {std?.name || 'Student'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#647089' }}>
                        {std?.tgid}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a56b0', mb: 1 }}>
                    Unit {syl?.unitNo}: {syl?.title}
                  </Typography>

                  <Box sx={{ mb: 1.5, flexGrow: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block' }}>
                      Areas to Improve:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.85rem', mb: 1 }}>
                      {evl.areasToImprove || 'None observed - standard met.'}
                    </Typography>

                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block' }}>
                      Trainer Action Plan:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.85rem' }}>
                      {evl.trainerPlan || 'Continue standard competency practice.'}
                    </Typography>
                  </Box>

                  <Box sx={{ pt: 1.5, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => {
                        setModalTargetStudent(std || null);
                        setOfficialModalOpen(true);
                      }}
                      sx={{ fontWeight: 700 }}
                    >
                      A4 Dossier
                    </Button>

                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        component="a"
                        href={getWhatsAppUrl(std?.phone || '', getSingleStudentShareText(std || {}))}
                        target="_blank"
                        sx={{ color: '#16834b' }}
                      >
                        <WhatsAppIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(evl.id)} sx={{ color: '#d5372f' }}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Add Evaluation Dialog */}
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
              <AssessmentIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.2 }}>
                सीप तथा दक्षता मूल्याङ्कन (Evaluate Student Skill)
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.72rem' }}>
                {selectedGroup?.groupCode} • CTEVT मानक सीप चेकलिस्ट तथा प्राविधिक दक्षता मूल्याङ्कन
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
            {/* Student selection */}
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
                -- विद्यार्थी छान्नुहोस् (Select Student) --
              </MenuItem>
              {groupStudents.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name} ({s.tgid})
                </MenuItem>
              ))}
            </TextField>

            {/* Syllabus Skill selection */}
            <TextField
              select
              label="Select Syllabus Skill / Task *"
              fullWidth
              size="small"
              value={formData.syllabusId}
              onChange={(e) => setFormData({ ...formData, syllabusId: e.target.value })}
              required
            >
              <MenuItem value="" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                -- पाठ्यक्रम एकाइ / सीप छान्नुहोस् --
              </MenuItem>
              {availableSyllabi.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  Unit {s.unitNo}: {s.title} ({s.learningOutcome})
                </MenuItem>
              ))}
            </TextField>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.mastered}
                  onChange={(e) => setFormData({ ...formData, mastered: e.target.checked })}
                  color="success"
                />
              }
              label={
                <Typography sx={{ fontWeight: 800, color: formData.mastered ? '#16834b' : '#c9820a' }}>
                  {formData.mastered ? 'Skill Mastered (दक्षता हासिल भयो - Competent)' : 'In Progress (थप अभ्यास आवश्यक - Needs Practice)'}
                </Typography>
              }
            />

            <TextField
              label="Areas to Improve (सुधार गर्नुपर्ने पक्षहरू)"
              fullWidth
              size="small"
              value={formData.areasToImprove}
              onChange={(e) => setFormData({ ...formData, areasToImprove: e.target.value })}
              placeholder="उदा: कार्यथलो गति, औजार सुरक्षा, परिशुद्धता तथा फिनिसिङ..."
            />

            <TextField
              label="Trainer Action Plan (प्रशिक्षकको आगामी योजना)"
              multiline
              rows={2}
              fullWidth
              size="small"
              placeholder="उदा: आगामी सत्रमा व्यक्तिगत सुपरिवेक्षण र अतिरिक्त अभ्यास समय उपलब्ध गराउने..."
              value={formData.trainerPlan}
              onChange={(e) => setFormData({ ...formData, trainerPlan: e.target.value })}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Evaluator Name"
                  fullWidth
                  size="small"
                  value={formData.evaluatorName}
                  onChange={(e) => setFormData({ ...formData, evaluatorName: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="Evaluation Date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={formData.evaluatedAt}
                  onChange={(e) => setFormData({ ...formData, evaluatedAt: e.target.value })}
                />
              </Grid>
            </Grid>
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
            सुरक्षित गर्नुहोस् (Save Evaluation)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Official CTEVT Standard A4 Printable Modal */}
      <OfficialDocumentModal
        open={officialModalOpen}
        onClose={() => setOfficialModalOpen(false)}
        docType="EVALUATION"
        title={modalTargetStudent ? 'TRAINEE COMPETENCY ASSESSMENT DOSSIER' : 'GROUP COMPETENCY ASSESSMENT MATRIX'}
        nepaliTitle={modalTargetStudent ? 'प्रशिक्षार्थी सीप तथा दक्षता मूल्यांकन विवरण' : 'समूह दक्षता मूल्यांकन अभिलेख'}
        group={selectedGroup}
        course={selectedCourse}
        trainer={trainer}
        metadata={{
          dateRange: modalTargetStudent
            ? `Trainee: ${modalTargetStudent.name} (${modalTargetStudent.tgid})`
            : `${selectedGroup?.admissionDate || '2026-09-01'} → ${selectedGroup?.expectedEndDate || '2026-10-31'}`
        }}
        shareText={modalTargetStudent ? getSingleStudentShareText(modalTargetStudent) : getBatchAssessmentShareText()}
        sharePhone={modalTargetStudent?.phone || trainer?.phone || ''}
      >
        {modalTargetStudent ? (
          /* Individual Student Competency Assessment Dossier */
          <Box>
            {(() => {
              const studentEvls = (db.evaluations || []).filter((e) => e.studentId === modalTargetStudent.id);
              const studentMasteredCount = studentEvls.filter((e) => e.mastered).length;
              const rate = studentEvls.length > 0 ? Math.round((studentMasteredCount / studentEvls.length) * 100) : 0;

              return (
                <Box>
                  {/* Trainee Profile Bar */}
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', border: '1px solid #cbd5e1', mb: 2, borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar src={modalTargetStudent.photoUrl} sx={{ width: 44, height: 44, bgcolor: '#1a56b0', fontWeight: 900 }}>
                        {modalTargetStudent.name?.[0] || 'S'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0f172a' }}>
                          {modalTargetStudent.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                          <b>Registration / TGID:</b> {modalTargetStudent.tgid} • <b>Contact:</b> {modalTargetStudent.phone || '—'}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ textAlign: 'right' }}>
                      <Chip
                        icon={<VerifiedUserIcon />}
                        label={rate >= 75 ? 'Competency Certified' : 'In Progress'}
                        color={rate >= 75 ? 'success' : 'warning'}
                        size="small"
                        sx={{ fontWeight: 800 }}
                      />
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontWeight: 700, color: '#1a56b0' }}>
                        Mastery: {studentMasteredCount} / {studentEvls.length} Tasks ({rate}%)
                      </Typography>
                    </Box>
                  </Box>

                  {/* Competency Tasks Table */}
                  <Table size="small" sx={{ border: '1px solid #0f172a', '& th, & td': { border: '1px solid #cbd5e1', fontSize: '0.8rem' } }}>
                    <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 45 }}>क्र.सं.</TableCell>
                        <TableCell sx={{ fontWeight: 900, width: 150 }}>सीप / पाठ्यक्रम इकाइ</TableCell>
                        <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 100 }}>दक्षता स्थिति</TableCell>
                        <TableCell sx={{ fontWeight: 900 }}>सुधार गर्नुपर्ने पक्षहरू</TableCell>
                        <TableCell sx={{ fontWeight: 900 }}>प्रशिक्षकको आगामी योजना</TableCell>
                        <TableCell sx={{ fontWeight: 900, width: 85 }}>मूल्यांकन मिति</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {studentEvls.map((e, idx) => {
                        const syl = db.syllabi.find((s) => s.id === e.syllabusId);
                        return (
                          <TableRow key={e.id}>
                            <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>
                              Unit {syl?.unitNo}: {syl?.title}
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              {e.mastered ? (
                                <span style={{ color: '#16834b', fontWeight: 800 }}>✓ Mastered</span>
                              ) : (
                                <span style={{ color: '#c9820a', fontWeight: 700 }}>⏳ In Progress</span>
                              )}
                            </TableCell>
                            <TableCell>{e.areasToImprove || 'Satisfactory'}</TableCell>
                            <TableCell>{e.trainerPlan || 'Continue standard practice'}</TableCell>
                            <TableCell>{e.evaluatedAt}</TableCell>
                          </TableRow>
                        );
                      })}
                      {studentEvls.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3, color: '#94a3b8' }}>
                            No skill evaluations recorded yet for this trainee.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
              );
            })()}
          </Box>
        ) : (
          /* Batch Group Competency Assessment Table */
          <Box>
            <Table size="small" sx={{ border: '1px solid #0f172a', '& th, & td': { border: '1px solid #cbd5e1', fontSize: '0.8rem' } }}>
              <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 45 }}>क्र.सं.</TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 140 }}>प्रशिक्षार्थी नाम र TGID</TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 140 }}>मूल्यांकन गरिएको सीप</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 95 }}>दक्षता स्थिति</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>सुधार तथा सुझाव</TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 130 }}>प्रशिक्षकको योजना</TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 85 }}>मूल्यांकनकर्ता</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groupEvaluations.map((evl, idx) => {
                  const std = db.students.find((s) => s.id === evl.studentId);
                  const syl = db.syllabi.find((s) => s.id === evl.syllabusId);
                  return (
                    <TableRow key={evl.id}>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</TableCell>
                      <TableCell>
                        <b>{std?.name || 'Trainee'}</b>
                        <br />
                        <span style={{ color: '#647089' }}>{std?.tgid}</span>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        Unit {syl?.unitNo}: {syl?.title}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        {evl.mastered ? (
                          <span style={{ color: '#16834b', fontWeight: 800 }}>✓ Mastered</span>
                        ) : (
                          <span style={{ color: '#c9820a', fontWeight: 700 }}>⏳ In Progress</span>
                        )}
                      </TableCell>
                      <TableCell>{evl.areasToImprove || '—'}</TableCell>
                      <TableCell>{evl.trainerPlan || '—'}</TableCell>
                      <TableCell>{evl.evaluatorName}</TableCell>
                    </TableRow>
                  );
                })}
                {groupEvaluations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3, color: '#94a3b8' }}>
                      No evaluations recorded yet for this group.
                    </TableCell>
                  </TableRow>
                )}
                {/* Summary Footer */}
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell colSpan={3} sx={{ fontWeight: 900, textAlign: 'right' }}>
                    कुल दक्षता उपलब्धि (OVERALL MASTERY RATE):
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', fontWeight: 900, color: '#16834b' }}>
                    {masteredCount} / {totalEvaluations}
                  </TableCell>
                  <TableCell colSpan={3} sx={{ fontWeight: 800 }}>
                    {masteryRatePercent}% Competencies Successfully Mastered
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        )}
      </OfficialDocumentModal>
    </Box>
  );
}
